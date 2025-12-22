import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PaymentMethod } from '@database/entities/order/payment-method';
import { OrderPaginationDto } from '@common/pagination/dto/order/orderPagination.dto';
import { JWTUserType, OrderBillType } from '@common/utils/type';
import { Method } from '@common/enums/payment-menthod.enum';
import { TicketService } from '@modules/ticket/ticket.service';
import { OrderValidationService } from './services/order-validation.service';
import { OrderCalculationService } from './services/order-calculation.service';
import { OrderCreationService } from './services/order-creation.service';
import { OrderSeatManagementService } from './services/order-seat-management.service';
import { OrderQueryService } from './services/order-query.service';
import { OrderDailyReportService } from './services/order-daily-report.service';
import { Product } from '@database/entities/item/product';
import { MomoService } from './payment-gateway/momo/momo.service';
import { PayPalService } from './payment-gateway/paypal/paypal.service';
import { VisaService } from './payment-gateway/visa/visa.service';
import { VnpayService } from './payment-gateway/vnpay/vnpay.service';
import { ZalopayService } from './payment-gateway/zalopay/zalopay.service';


@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(PaymentMethod)
    private paymentMethodRepository: Repository<PaymentMethod>,

    // Injected services
    private readonly orderValidationService: OrderValidationService,
    private readonly orderCalculationService: OrderCalculationService,
    private readonly orderCreationService: OrderCreationService,
    private readonly orderSeatManagementService: OrderSeatManagementService,
    private readonly orderQueryService: OrderQueryService,
    private readonly orderDailyReportService: OrderDailyReportService,

    // Payment services
    private readonly momoService: MomoService,
    private readonly paypalService: PayPalService,
    private readonly visaService: VisaService,
    private readonly vnpayService: VnpayService,
    private readonly zalopayService: ZalopayService,

    // Other services
    private readonly ticketService: TicketService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async createOrder(
    userData: JWTUserType,
    orderBill: OrderBillType,
    clientIp: string,
  ): Promise<{ payUrl: string }> {
    // Step 1: Validate total price
    this.orderValidationService.validateTotalPrices(orderBill.total_prices);

    // Step 2: Get and validate user and customer
    let user = await this.orderValidationService.getUserById(
      userData.account_id,
    );
    let customer = null;

    if (orderBill.customer_id) {
      this.orderValidationService.validateCustomerId(
        orderBill.customer_id,
        userData.account_id,
      );
      customer = await this.orderValidationService.getUserById(
        orderBill.customer_id,
      );
    }

    // Step 3: Get products if 
    let orderExtras: Product[] = [];
    const products = orderBill.products || [];
    if (products.length > 0) {
      const productIds = products.map((item) => item.product_id);
      orderExtras = await this.orderValidationService.getOrderExtraByIds(
        productIds,
      );
    }

    // Step 4: Get promotion and schedule
    const [promotion, schedule] = await Promise.all([
      this.orderValidationService.getPromotionById(orderBill.promotion_id),
      this.orderValidationService.getScheduleById(orderBill.schedule_id),
    ]);

    // Step 5: Validate promotion
    if (promotion.id !== 1) {
      this.orderValidationService.validatePromotionForStaff(
        user,
        orderBill.customer_id,
      );
      this.orderValidationService.validatePromotionTime(promotion);
      this.orderValidationService.validateUserScore(user, promotion);

      if (customer) {
        this.orderValidationService.validateCustomer(customer, promotion);
      }
    }

    // Step 6: Validate seats in Redis
    const seatIds = orderBill.seats.map((seat) => seat.id);
    const scheduleId = orderBill.schedule_id;

    const check = await this.orderValidationService.validateBeforeOrder(
      scheduleId,
      user.id,
      seatIds,
    );
    if (!check) {
      throw new BadRequestException(
        'Seats are being held by another user. Please try again later.',
      );
    }

    // Step 7: Get schedule seats and validate availability
    const scheduleSeats =
      await this.orderValidationService.getScheduleSeatsByIds(
        seatIds,
        orderBill.schedule_id,
      );
    this.orderValidationService.validateSeatsAvailability(scheduleSeats);

    // Step 8: Get ticket types
    const audienceTypes = orderBill.seats.map((seat) => seat.audience_type);
    const ticketForAudienceTypes =
      await this.orderValidationService.getTicketTypesByAudienceTypes(
        audienceTypes,
      );

    // Step 9: Calculate prices
    const priceBreakdown = this.orderCalculationService.calculateTotalPrice(
      orderBill.seats,
      scheduleSeats,
      ticketForAudienceTypes,
      orderExtras,
      orderBill,
      promotion,
    );

    // Step 10: Validate calculated total with input total
    const inputTotal = parseFloat(orderBill.total_prices);
    this.orderValidationService.validateTotalPrice(
      priceBreakdown.totalPrice,
      inputTotal,
    );

    // Step 11: Get payment method
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: Number(orderBill.payment_method_id) },
    });
    if (!paymentMethod) {
      throw new NotFoundException(
        `Payment method ${orderBill.payment_method_id} not found`,
      );
    }

    // Step 12: Get payment code from gateway
    const paymentCode: { payUrl: string; orderId: string } =
      await this.getPaymentCode(orderBill, clientIp);
    if (!paymentCode || !paymentCode.payUrl || !paymentCode.orderId) {
      throw new BadRequestException('Payment method failed to create order');
    }

    // Step 13: Create order
    const isCashPayment =
      Number(orderBill.payment_method_id as Method) === Method.CASH;
    const newOrder = await this.orderCreationService.createOrder({
      user,
      customer,
      promotion,
      totalPrices: orderBill.total_prices,
      originalTickets: priceBreakdown.totalSeats,
      paymentMethodId: Number(orderBill.payment_method_id),
    });

    // Step 13.1: Create transaction
    await this.orderCreationService.createTransaction(
      newOrder,
      paymentCode.orderId,
      orderBill.total_prices,
      paymentMethod,
      Number(orderBill.payment_method_id),
    );

    // Step 14: Update seats status to HELD
    await this.orderSeatManagementService.updateSeatsStatusToHeld(
      scheduleSeats,
    );

    // Step 15: Create tickets and order details
    await this.orderCreationService.createTicketsAndOrderDetails(
      orderBill.seats,
      scheduleSeats,
      ticketForAudienceTypes,
      schedule,
      newOrder,
      priceBreakdown.seatPriceMap,
      isCashPayment,
    );

    // Step 16: Create order extras if any
    if (orderExtras.length > 0) {
      const productTotals = this.orderCalculationService.calculateProductTotals(
        orderExtras,
        orderBill,
      );

      const totalProductBeforePromo = productTotals.reduce(
        (sum, item) => sum + item.total,
        0,
      );

      const { isPercentage } =
        this.orderCalculationService.calculatePromotionDiscount(
          promotion,
          priceBreakdown.totalBeforePromotion,
        );

      await this.orderCreationService.createOrderExtras({
        productTotals,
        order: newOrder,
        productDiscount: priceBreakdown.productDiscount,
        totalProductBeforePromo,
        isPercentage,
        isCashPayment,
        unitPriceCalculator: (item) =>
          this.orderCalculationService.calculateProductUnitPrice(
            item,
            priceBreakdown.productDiscount,
            totalProductBeforePromo,
            isPercentage,
          ),
      });
    }

    // Step 17: If cash payment, change seats to BOOKED
    if (isCashPayment) {
      await this.orderSeatManagementService.changeStatusScheduleSeatToBooked(
        seatIds,
        orderBill.schedule_id,
      );
    }

    // Step 18: Add score for cash payment
    if (isCashPayment) {
      const promotionExchange = promotion?.exchange ?? 0;
      const addScore = this.orderCalculationService.calculateOrderScore(
        priceBreakdown.totalPrice,
        promotionExchange,
      );

      await this.orderCreationService.addScoreForUser(
        user,
        customer,
        addScore,
        newOrder,
      );
    }

    // Step 19: Emit socket events
    if (isCashPayment) {
      this.orderSeatManagementService.emitBookSeat(
        orderBill.schedule_id,
        seatIds,
      );
    } else {
      this.orderSeatManagementService.emitHoldSeat(
        orderBill.schedule_id,
        seatIds,
      );
    }

    return { payUrl: paymentCode.payUrl };
  }

  private async getPaymentCode(
    orderBill: OrderBillType,
    clientIp: string,
  ): Promise<{ payUrl: string; orderId: string }> {
    switch (Number(orderBill.payment_method_id as Method)) {
      case Method.MOMO:
        return this.momoService.createOrderMomo(orderBill.total_prices);
      case Method.PAYPAL:
        return this.paypalService.createOrderPaypal(orderBill);
      case Method.VISA:
        return this.visaService.createOrderVisa(orderBill);
      case Method.VNPAY:
        return this.vnpayService.createOrderVnPay(
          orderBill.total_prices,
          clientIp,
        );
      case Method.ZALOPAY:
        return this.zalopayService.createOrderZaloPay(orderBill);
      default:
        return {
          payUrl: 'Payment successful by Cash',
          orderId: 'CASH_ORDER_' + new Date().getTime(),
        };
    }
  }

  async getAllOrders(filters: OrderPaginationDto) {
    return this.orderQueryService.getAllOrders(filters);
  }

  async getOrderByIdEmployeeAndAdmin(orderId: number) {
    return this.orderQueryService.getOrderByIdEmployeeAndAdmin(orderId);
  }

  async getMyOrders(filters: OrderPaginationDto & { userId: string }) {
    return this.orderQueryService.getMyOrders(filters);
  }

  async scanQrCode(qrCode: string) {
    const rawDecoded = this.jwtService.verify(qrCode, {
      secret: this.configService.get<string>('jwt.qrSecret'),
    });
    const decoded = rawDecoded as { orderId: number };
    const order = await this.getOrderByIdEmployeeAndAdmin(decoded.orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    //  use all ticket in order by qr code
    const ticketIds = order.orderDetails.map((detail) => detail.ticketId);
    if (ticketIds.length === 0) {
      throw new NotFoundException('No tickets found for this order');
    }
    await this.ticketService.markTicketsAsUsed(ticketIds);
    return order;
  }

  async dailyReportRevenue() {
    return this.orderDailyReportService.dailyReportRevenue();
  }
}
