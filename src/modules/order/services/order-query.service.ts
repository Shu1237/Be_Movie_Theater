import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order } from '@database/entities/order/order';
import { User } from '@database/entities/user/user';
import { StatusOrder } from '@common/enums/status-order.enum';
import { applySorting } from '@common/pagination/apply_sort';
import { applyCommonFilters } from '@common/pagination/applyCommonFilters';
import { applyPagination } from '@common/pagination/applyPagination';
import { OrderPaginationDto } from '@common/pagination/dto/order/orderPagination.dto';
import { orderFieldMapping } from '@common/pagination/fillters/order-field-mapping';
import { buildPaginationResponse } from '@common/pagination/pagination-response';

@Injectable()
export class OrderQueryService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getAllOrders(
    filters: OrderPaginationDto,
  ): Promise<ReturnType<typeof buildPaginationResponse>> {
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('order.promotion', 'promotion')
      .leftJoinAndSelect('order.transaction', 'transaction')
      .leftJoinAndSelect('transaction.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('order.orderDetails', 'orderDetail')
      .leftJoinAndSelect('orderDetail.ticket', 'ticket')
      .leftJoinAndSelect('ticket.seat', 'seat')
      .leftJoinAndSelect('ticket.ticketType', 'ticketType')
      .leftJoinAndSelect('orderDetail.schedule', 'schedule')
      .leftJoinAndSelect('schedule.movie', 'movie')
      .leftJoinAndSelect('schedule.cinemaRoom', 'cinemaRoom')
      .leftJoinAndSelect('order.orderExtras', 'orderExtra')
      .leftJoinAndSelect('orderExtra.product', 'product');

    //  Apply filters
    applyCommonFilters(qb, filters, orderFieldMapping);

    //  Apply sorting
    const allowedSortFields = [
      'order.id',
      'order.order_date',
      'user.username',
      'movie.name',
      'paymentMethod.name',
      'order.status',
      'order.total_prices',
    ];
    applySorting(
      qb,
      filters.sortBy,
      filters.sortOrder,
      allowedSortFields,
      'order.order_date',
    );

    //  Pagination
    applyPagination(qb, {
      page: filters.page,
      take: filters.take,
    });

    const [orders, total] = await qb.getManyAndCount();
    if (total === 0) {
      return buildPaginationResponse([], {
        total: 0,
        page: 1,
        take: filters.take,
        totalSuccess: 0,
        totalFailed: 0,
        totalPending: 0,
        revenue: '0',
      });
    }
    const mapCustomerId = new Map<number, string>();
    orders.forEach((order) => {
      if (order.customer_id) {
        mapCustomerId.set(order.id, order.customer_id);
      }
    });

    const customerIds = Array.from(new Set(mapCustomerId.values()));

    const customers = await this.userRepository.find({
      where: { id: In(customerIds) },
    });

    const customerMap = new Map<string, string>();
    customers.forEach((customer) => {
      customerMap.set(customer.id, customer.username);
    });

    //  Map to summary DTO
    const summaries = orders.map((order) =>
      this.mapToBookingSummaryLite(order, customerMap),
    );
    //  Calculate additional metrics
    const [statusCounts, revenueResult] = await Promise.all([
      this.orderRepository
        .createQueryBuilder('order')
        .select('order.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('order.status')
        .getRawMany(),

      this.orderRepository
        .createQueryBuilder('order')
        .select('SUM(order.total_prices)', 'revenue')
        .where('order.status = :status', { status: StatusOrder.SUCCESS })
        .getRawOne<{ revenue: string }>(),
    ]);

    const countByStatus: Record<string, number> = Object.fromEntries(
      statusCounts.map((row) => [row.status, Number(row.count)]),
    );

    const totalSuccess = countByStatus[StatusOrder.SUCCESS] || 0;
    const totalFailed = countByStatus[StatusOrder.FAILED] || 0;
    const totalPending = countByStatus[StatusOrder.PENDING] || 0;

    return buildPaginationResponse(summaries, {
      total,
      page: filters.page,
      take: filters.take,
      totalSuccess,
      totalFailed,
      totalPending,
      revenue: revenueResult?.revenue || '0',
    });
  }

  async getOrderByIdEmployeeAndAdmin(
    orderId: number,
  ): Promise<ReturnType<typeof this.mapToBookingSummaryLite>> {
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('order.promotion', 'promotion')
      .leftJoinAndSelect('order.transaction', 'transaction')
      .leftJoinAndSelect('transaction.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('order.orderDetails', 'orderDetail')
      .leftJoinAndSelect('orderDetail.ticket', 'ticket')
      .leftJoinAndSelect('ticket.seat', 'seat')
      .leftJoinAndSelect('ticket.ticketType', 'ticketType')
      .leftJoinAndSelect('orderDetail.schedule', 'schedule')
      .leftJoinAndSelect('schedule.movie', 'movie')
      .leftJoinAndSelect('schedule.cinemaRoom', 'cinemaRoom')
      .leftJoinAndSelect('order.orderExtras', 'orderExtra')
      .leftJoinAndSelect('orderExtra.product', 'product')
      .where('order.id = :orderId', { orderId });

    const order = await qb.getOne();

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    return this.mapToBookingSummaryLite(order);
  }

  async getMyOrders(
    filters: OrderPaginationDto & { userId: string },
  ): Promise<ReturnType<typeof buildPaginationResponse>> {
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('order.promotion', 'promotion')
      .leftJoinAndSelect('order.transaction', 'transaction')
      .leftJoinAndSelect('transaction.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('order.orderDetails', 'orderDetail')
      .leftJoinAndSelect('orderDetail.ticket', 'ticket')
      .leftJoinAndSelect('ticket.seat', 'seat')
      .leftJoinAndSelect('ticket.ticketType', 'ticketType')
      .leftJoinAndSelect('orderDetail.schedule', 'schedule')
      .leftJoinAndSelect('schedule.movie', 'movie')
      .leftJoinAndSelect('schedule.cinemaRoom', 'cinemaRoom')
      .leftJoinAndSelect('order.orderExtras', 'orderExtra')
      .leftJoinAndSelect('orderExtra.product', 'product')
      .where('user.id = :userId', { userId: filters.userId });
    applyCommonFilters(qb, filters, orderFieldMapping);

    const allowedSortFields = [
      'order.id',
      'order.order_date',
      'movie.name',
      'paymentMethod.name',
      'order.status',
      'order.total_prices',
    ];

    applySorting(
      qb,
      filters.sortBy,
      filters.sortOrder,
      allowedSortFields,
      'order.order_date',
    );

    applyPagination(qb, {
      page: filters.page,
      take: filters.take,
    });

    const [orders, total] = await qb.getManyAndCount();
    if (total === 0) {
      return buildPaginationResponse([], {
        total: 0,
        page: 1,
        take: filters.take,
        totalSuccess: 0,
        totalFailed: 0,
        totalPending: 0,
        revenue: '0',
      });
    }

    const summaries = orders.map((order) =>
      this.mapToBookingSummaryLite(order),
    );

    const [statusCounts, revenueResult] = await Promise.all([
      this.orderRepository
        .createQueryBuilder('order')

        .select('order.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('order.user.id = :userId', { userId: filters.userId })
        .groupBy('order.status')
        .getRawMany(),

      this.orderRepository
        .createQueryBuilder('order')
        .select('SUM(order.total_prices)', 'revenue')
        .where('order.status = :status', { status: StatusOrder.SUCCESS })
        .andWhere('order.user.id = :userId', { userId: filters.userId })
        .getRawOne<{ revenue: string }>(),
    ]);

    const countByStatus = Object.fromEntries(
      statusCounts.map((row) => [row.status, Number(row.count)]),
    );

    const totalSuccess = countByStatus[StatusOrder.SUCCESS] || 0;
    const totalFailed = countByStatus[StatusOrder.FAILED] || 0;
    const totalPending = countByStatus[StatusOrder.PENDING] || 0;

    return buildPaginationResponse(summaries, {
      total,
      page: filters.page,
      take: filters.take,
      totalSuccess,
      totalFailed,
      totalPending,
      revenue: revenueResult?.revenue || '0',
    });
  }

  private mapToBookingSummaryLite(
    order: Order,
    customers?: Map<string, string>,
  ) {
    // check order có customer k
    const customerUser = order.customer_id
      ? customers?.get(order.customer_id)
      : undefined;
    return {
      id: order.id,
      order_date: order.order_date,
      total_prices: order.total_prices,
      original_tickets: order.original_tickets,
      status: order.status,
      qr_code: order.qr_code ?? undefined,
      customer_id: order.customer_id ?? undefined,
      customer_username: customerUser,
      user: {
        id: order.user.id,
        username: order.user.username,
        email: order.user.email,
        role: order.user.role.role_id,
      },
      promotion: {
        id: order.promotion?.id,
        title: order.promotion?.title,
      },
      cinemaroom: {
        id: order.orderDetails[0].schedule.cinemaRoom.id,
        name: order.orderDetails[0].schedule.cinemaRoom.cinema_room_name,
      },
      schedule: {
        id: order.orderDetails[0].schedule.id,
        start_time: order.orderDetails[0].schedule.start_movie_time,
        end_time: order.orderDetails[0].schedule.end_movie_time,
      },
      movie: {
        id: order.orderDetails[0].schedule.movie.id,
        name: order.orderDetails[0].schedule.movie.name,
      },
      orderDetails: order.orderDetails.map((detail) => ({
        id: detail.id,
        total_each_ticket: detail.total_each_ticket,
        ticketId: detail.ticket.id,
        seat: {
          id: detail.ticket.seat.id,
          seat_row: detail.ticket.seat.seat_row,
          seat_column: detail.ticket.seat.seat_column,
        },
        ticketType: {
          ticket_name: detail.ticket.ticketType.ticket_name,
          audience_type: detail.ticket.ticketType.audience_type,
        },
      })),
      orderExtras:
        order.orderExtras?.map((extra) => ({
          id: extra.id,
          quantity: extra.quantity,
          unit_price: extra.unit_price,
          status: extra.status,
          product: {
            id: extra.product.id,
            name: extra.product.name,
            category: extra.product.category,
            price: extra.product.price,
          },
        })) ?? [],
        transaction:
        order.transactions?.map((transaction) => ({
          id: transaction.id,
          transaction_code: transaction.transaction_code,
          transaction_date: transaction.transaction_date,
          prices: transaction.prices,
          status: transaction.status,
          paymentMethod: {
            id: transaction.paymentMethod.id,
            name: transaction.paymentMethod.name,
          },
        })) ?? [],
        
    };
  }
}
