import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import Redis from 'ioredis';
import { User } from '@database/entities/user/user';
import { Promotion } from '@database/entities/promotion/promotion';
import { Schedule } from '@database/entities/cinema/schedule';
import { Order } from '@database/entities/order/order';
import { Transaction } from '@database/entities/order/transaction';
import { TicketType } from '@database/entities/order/ticket-type';
import { Product } from '@database/entities/item/product';
import { Combo } from '@database/entities/item/combo';
import { ScheduleSeat } from '@database/entities/cinema/schedule_seat';
import { StatusSeat } from '@common/enums/status_seat.enum';
import { Role } from '@common/enums/roles.enum';
import { HoldSeatType } from '@common/utils/type';
import { MyGateWay } from '@common/gateways/seat.gateway';

@Injectable()
export class OrderValidationService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Promotion)
    private promotionRepository: Repository<Promotion>,
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(TicketType)
    private ticketTypeRepository: Repository<TicketType>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Combo)
    private comboRepository: Repository<Combo>,
    @InjectRepository(ScheduleSeat)
    private scheduleSeatRepository: Repository<ScheduleSeat>,
    @Inject('REDIS_CLIENT') 
    private readonly redisClient: Redis,
    private readonly gateway: MyGateWay,
  ) {}

  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  async getPromotionById(promotionId: number): Promise<Promotion> {
    const promotion = await this.promotionRepository.findOne({
      where: { id: promotionId, is_active: true },
      relations: ['promotionType'],
    });
    if (!promotion) {
      throw new NotFoundException(
        `Promotion with ID ${promotionId} not found or is not active`,
      );
    }
    return promotion;
  }

  async getScheduleById(scheduleId: number): Promise<Schedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId, is_deleted: false },
    });
    if (!schedule) {
      throw new NotFoundException(
        `Schedule with ID ${scheduleId} not found or is deleted`,
      );
    }
    return schedule;
  }

  async getOrderById(orderId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['transaction'],
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }
    return order;
  }

  async getTransactionById(transactionId: number): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['order', 'paymentMethod'],
    });
    if (!transaction) {
      throw new NotFoundException(
        `Transaction with ID ${transactionId} not found`,
      );
    }
    return transaction;
  }

  async getTicketTypesByAudienceTypes(audienceTypes: string[]): Promise<TicketType[]> {
    const ticketTypes = await this.ticketTypeRepository.find({
      where: { audience_type: In(audienceTypes) },
    });

    if (!ticketTypes || ticketTypes.length === 0) {
      throw new NotFoundException(
        `No ticket types found for audiences: ${audienceTypes.join(', ')}`,
      );
    }

    return ticketTypes;
  }

  async getOrderExtraByIds(productIds: number[]): Promise<Product[]> {
    const products = await this.productRepository.find({
      where: { id: In(productIds), is_deleted: false },
    });
    if (!products || products.length === 0) {
      throw new NotFoundException(
        `No products found for IDs: ${productIds.join(', ')}`,
      );
    }

    // get all combos 
    const allCombos = await this.comboRepository.find();

    // Create a map from combo data
    const comboMap = new Map(
      allCombos.map((combo) => [combo.id, combo.discount]),
    );

    // Enhance products with discounts from combo map
    return products.map((product) => ({
      ...product,
      discount: comboMap.get(product.id) ?? undefined,
    }));
  }

  async getScheduleSeatsByIds(seatIds: string[], scheduleId: number): Promise<ScheduleSeat[]> {
    const scheduleSeats = await this.scheduleSeatRepository.find({
      where: {
        seat: { id: In(seatIds) },
        schedule: { id: scheduleId },
      },
      relations: ['seat', 'seat.seatType'],
    });
    if (!scheduleSeats || scheduleSeats.length === 0) {
      throw new NotFoundException(
        `No schedule seats found for IDs: ${seatIds.join(', ')} in schedule ${scheduleId}`,
      );
    }
    return scheduleSeats;
  }

  async validateBeforeOrder(
    scheduleId: number,
    userId: string,
    requestSeatIds: string[],
  ): Promise<boolean> {
    const redisKey = `seat-hold-${scheduleId}-${userId}`;
    const data = await this.redisClient.get(redisKey);

    if (!data) {
      // socket seat return not yet
      this.gateway.emitCancelBookSeat({
        schedule_id: scheduleId,
        seatIds: requestSeatIds,
      });
      throw new BadRequestException(
        'Your seat hold has expired. Please select seats again.',
      );
    }

    const keys = await this.redisClient.keys(`seat-hold-${scheduleId}-*`);

    if (!keys.length) return true;

    const redisData = await Promise.all(
      keys.map((key) => this.redisClient.get(key)),
    );

    for (let i = 0; i < redisData.length; i++) {
      const key = keys[i];
      const data = redisData[i];
      if (!data) continue;

      const prefix = `seat-hold-${scheduleId}-`;
      const redisUserId = key.slice(prefix.length);
      // Skip if this key belongs to the user who is booking
      if (redisUserId === userId) continue;

      let parsed: HoldSeatType;
      try {
        parsed = JSON.parse(data);
      } catch (e) {
        continue;
      }

      // Check seat overlap
      const isSeatHeld = requestSeatIds.some((seatId) =>
        parsed.seatIds.includes(seatId),
      );
      if (isSeatHeld) {
        return false;
      }
    }

    // Delete Redis key for the current user after successful booking
    await this.redisClient.del(redisKey);
    return true;
  }

  validatePromotionTime(promotion: Promotion): void {
    if (promotion.id !== 1) {
      const currentTime = new Date();
      if (
        !promotion.start_time ||
        !promotion.end_time ||
        promotion.start_time > currentTime ||
        promotion.end_time < currentTime
      ) {
        throw new BadRequestException('Promotion is not valid at this time.');
      }
    }
  }

  validatePromotionForStaff(user: User, customerId?: string): void {
    if (
      ((user.role.role_id as Role) === Role.EMPLOYEE ||
        (user.role.role_id as Role) === Role.ADMIN) &&
      !customerId
    ) {
      throw new ConflictException(
        'Staff must provide customer ID when using promotion.',
      );
    }
  }

  validateUserScore(user: User, promotion: Promotion): void {
    if (
      (user.role.role_id as Role) === Role.USER &&
      promotion.exchange > user.score
    ) {
      throw new ConflictException(
        'You do not have enough score to use this promotion.',
      );
    }
  }

  validateCustomer(customer: User, promotion: Promotion): void {
    // Customer must have USER role
    if ((customer.role.role_id as Role) !== Role.USER) {
      throw new ConflictException('Customer must have USER role.');
    }
    // Check if customer has enough score
    if (promotion.exchange > customer.score) {
      throw new ConflictException(
        'Customer does not have enough score to use this promotion.',
      );
    }
  }

  validateSeatsAvailability(scheduleSeats: ScheduleSeat[]): void {
    const unavailableSeats = scheduleSeats.filter(
      (seat) =>
        seat.status === StatusSeat.BOOKED || seat.status === StatusSeat.HELD,
    );
    if (unavailableSeats.length > 0) {
      throw new BadRequestException(
        `Seats ${unavailableSeats.map((s) => s.seat.id).join(', ')} are already booked or held.`,
      );
    }
  }

  validateTotalPrice(calculatedTotal: number, inputTotal: number): void {
    if (Math.abs(calculatedTotal - inputTotal) > 0.01) {
      throw new BadRequestException(
        'Total price mismatch. Please refresh and try again.',
      );
    }
  }

  validateCustomerId(customerId: string, userId: string): void {
    if (customerId === userId) {
      throw new ConflictException('Cannot use your own ID as customer ID.');
    }
  }

  validateTotalPrices(totalPrices: string): void {
    if (Number(totalPrices) < 0) {
      throw new BadRequestException('Total price must be greater than 0.');
    }
  }
}
