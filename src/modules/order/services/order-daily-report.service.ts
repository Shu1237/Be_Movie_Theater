import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order } from '@database/entities/order/order';
import { PaymentMethod } from '@database/entities/order/payment-method';
import { DailyTransactionSummary } from '@database/entities/order/daily_transaction_summary';
import { PaymentGateway } from '@common/enums/payment_gateway.enum';
import { Method } from '@common/enums/payment-menthod.enum';
import { StatusOrder } from '@common/enums/status-order.enum';
import { formatDate } from '@common/utils/helper';
import { MomoService } from '../payment-gateway/momo/momo.service';
import { PayPalService } from '../payment-gateway/paypal/paypal.service';
import { VisaService } from '../payment-gateway/visa/visa.service';
import { VnpayService } from '../payment-gateway/vnpay/vnpay.service';
import { ZalopayService } from '../payment-gateway/zalopay/zalopay.service';

@Injectable()
export class OrderDailyReportService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(PaymentMethod)
    private paymentMethodRepository: Repository<PaymentMethod>,
    @InjectRepository(DailyTransactionSummary)
    private dailyTransactionSummaryRepository: Repository<DailyTransactionSummary>,
    private readonly momoService: MomoService,
    private readonly paypalService: PayPalService,
    private readonly visaService: VisaService,
    private readonly vnpayService: VnpayService,
    private readonly zalopayService: ZalopayService,
  ) {}

  async dailyReportRevenue() {
    const now = new Date();
    now.setUTCDate(now.getUTCDate() - 1); // lùi về hôm qua

    const startOfDay = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0,
        0,
        0,
      ),
    );

    const endOfDay = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23,
        59,
        59,
      ),
    );
    // const startOfDay = new Date(2025, 6, 29, 0, 0, 0);    // ngày 29/7/2025 lúc 00:00:00
    // const endOfDay = new Date(2025, 6, 29, 23, 59, 59);   // ngày 29/7/2025 lúc 23:59:59

    const orders = await this.orderRepository.find({
      where: { order_date: Between(startOfDay, endOfDay) },
      relations: ['transactions', 'transactions.paymentMethod'],
    });

    const result: Record<
      PaymentGateway,
      { totalSuccess: number; totalFailed: number; totalRevenue: number }
    > = {
      MOMO: { totalSuccess: 0, totalFailed: 0, totalRevenue: 0 },
      PAYPAL: { totalSuccess: 0, totalFailed: 0, totalRevenue: 0 },
      VISA: { totalSuccess: 0, totalFailed: 0, totalRevenue: 0 },
      VNPAY: { totalSuccess: 0, totalFailed: 0, totalRevenue: 0 },
      ZALOPAY: { totalSuccess: 0, totalFailed: 0, totalRevenue: 0 },
      CASH: { totalSuccess: 0, totalFailed: 0, totalRevenue: 0 },
    };

    const methodMap: Record<number, PaymentGateway> = {
      [Method.CASH]: PaymentGateway.CASH,
      [Method.MOMO]: PaymentGateway.MOMO,
      [Method.PAYPAL]: PaymentGateway.PAYPAL,
      [Method.VISA]: PaymentGateway.VISA,
      [Method.VNPAY]: PaymentGateway.VNPAY,
      [Method.ZALOPAY]: PaymentGateway.ZALOPAY,
    };

    const queryMethodStatus = async (
      method: PaymentGateway,
      code: string,
      date: Date,
    ) => {
      switch (method as PaymentGateway) {
        case PaymentGateway.MOMO:
          return await this.momoService.queryOrderStatusMomo(code);
        case PaymentGateway.PAYPAL:
          return await this.paypalService.queryOrderStatusPaypal(code);
        case PaymentGateway.VISA:
          return await this.visaService.queryOrderStatusVisa(code);
        case PaymentGateway.VNPAY:
          return await this.vnpayService.queryOrderStatusVnpay(
            code,
            formatDate(date),
          );
        case PaymentGateway.ZALOPAY:
          return await this.zalopayService.queryOrderStatusZaloPay(code);
        default:
          throw new Error(`Unsupported payment method: ${method}`);
      }
    };

    const tasks = orders.map(async (order) => {
      const { transactions, status, total_prices, order_date } = order;
      const transaction = transactions?.[0]; // Lấy transaction đầu tiên
      const methodId = transaction?.paymentMethod?.id;
      const code = transaction?.transaction_code;

      if (!methodId || !code) return;

      const method = methodMap[methodId];
      if (!method) return;

      if ((method as PaymentGateway) === PaymentGateway.CASH) {
        if ((status as StatusOrder) === StatusOrder.SUCCESS) {
          result[method].totalSuccess++;
          result[method].totalRevenue += Number(total_prices) || 0;
        } else {
          result[method].totalFailed++;
        }
        return;
      }

      try {
        const res = await queryMethodStatus(method, code, order_date);
        if (res?.paid) {
          result[method].totalSuccess++;
          result[method].totalRevenue += Number(res.total) || 0;
        } else {
          result[method].totalFailed++;
        }
      } catch (err) {
        result[method].totalFailed++;
      }
    });

    await Promise.allSettled(tasks);

    // optimize call db
    const paymentMethods = await this.paymentMethodRepository.find();
    const paymentMethodMap = new Map<string, PaymentMethod>();
    paymentMethods.forEach((pm) =>
      paymentMethodMap.set(pm.name.toUpperCase(), pm),
    );

    const reportDate = startOfDay.toISOString().slice(0, 10);

    for (const [method, summary] of Object.entries(result)) {
      const methodEntity = paymentMethodMap.get(method);
      if (!methodEntity) {
        console.warn(
          `Payment method ${method} not found, skipping summary record`,
        );
        continue;
      }

      const recordData: Omit<DailyTransactionSummary, 'id'> = {
        reportDate,
        totalOrders: summary.totalSuccess + summary.totalFailed,
        totalSuccess: summary.totalSuccess,
        totalFailed: summary.totalFailed,
        totalAmount: summary.totalRevenue,
        paymentMethod: methodEntity,
      };

      const record = this.dailyTransactionSummaryRepository.create(recordData);
      await this.dailyTransactionSummaryRepository.save(record);
    }

    return result;
  }
}
