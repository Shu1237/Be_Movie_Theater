import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { Repository } from 'typeorm';
import { PaymentGateway } from '@common/enums/payment_gateway.enum';
import { StatusOrder } from '@common/enums/status-order.enum';
import { MyGateWay } from '@common/gateways/seat.gateway';
import { MailService } from '@common/mail/mail.service';
import { QrCodeService } from '@common/qrcode/qrcode.service';
import { changeVnToUSD } from '@common/utils/helper';
import { OrderBillType } from '@common/utils/type';
import { ScheduleSeat } from '@database/entities/cinema/schedule_seat';
import { HistoryScore } from '@database/entities/order/history_score';
import { Order } from '@database/entities/order/order';
import { OrderExtra } from '@database/entities/order/order-extra';
import { Ticket } from '@database/entities/order/ticket';
import { User } from '@database/entities/user/user';
import { AbstractPaymentService } from '../base/abstract-payment.service';
import { Transaction } from '@database/entities/order/transaction';



@Injectable()
export class PayPalService extends AbstractPaymentService {
  constructor(
    @InjectRepository(Transaction)
    transactionRepository: Repository<Transaction>,
    @InjectRepository(Order)
    orderRepository: Repository<Order>,
    @InjectRepository(Ticket)
    ticketRepository: Repository<Ticket>,
    @InjectRepository(ScheduleSeat)
    scheduleSeatRepository: Repository<ScheduleSeat>,
    @InjectRepository(HistoryScore)
    historyScoreRepository: Repository<HistoryScore>,
    @InjectRepository(User)
    userRepository: Repository<User>,
    @InjectRepository(OrderExtra)
    orderExtraRepository: Repository<OrderExtra>,
    mailerService: MailService,
    gateway: MyGateWay,
    qrCodeService: QrCodeService,
    configService: ConfigService,
    jwtService: JwtService,
  ) {
    super(
      transactionRepository,
      orderRepository,
      ticketRepository,
      scheduleSeatRepository,
      historyScoreRepository,
      userRepository,
      orderExtraRepository,
      mailerService,
      gateway,
      qrCodeService,
      configService,
      jwtService,
    );
  }
  async generateAccessToken() {
    const response = await axios.request({
      method: 'POST',
      url: this.configService.get<string>('paypal.authUrl'),
      data: 'grant_type=client_credentials',
      auth: {
        username: this.configService.get<string>('paypal.clientId')!,
        password: this.configService.get<string>('paypal.clientSecret')!,
      },
    });

    return response.data.access_token;
  }

  async createOrderPaypal(item: OrderBillType) {
    const accessToken = await this.generateAccessToken();
    if (!accessToken)
      throw new InternalServerErrorException('Failed to generate access token');

    const totalUSD = changeVnToUSD(item.total_prices.toString());

    const response = await axios.post(
      `${this.configService.get<string>('paypal.baseUrl')}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: totalUSD,
            },
            description: `Booking for schedule ${item.schedule_id}, total seats: ${item.seats.length}`,
          },
        ],
        application_context: {
          return_url: this.configService.get<string>('paypal.successUrl'),
          cancel_url: this.configService.get<string>('paypal.cancelUrl'),
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          brand_name: 'manfra.io',
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return {
      payUrl: response.data.links.find((link: any) => link.rel === 'approve')
        ?.href,
      orderId: response.data.id,
    };
  }

  async captureOrderPaypal(orderId: string) {
    const accessToken = await this.generateAccessToken();
    if (!accessToken)
      throw new InternalServerErrorException('Failed to generate access token');

    const response = await axios.post(
      `${this.configService.get<string>('paypal.baseUrl')}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return response.data;
  }

  async handleReturnSuccessPaypal(transactionCode: string) {
    const transaction = await this.getTransactionByOrderId(transactionCode);
    if (transaction.status !== StatusOrder.PENDING) {
      throw new NotFoundException('Transaction is not in pending state');
    }
    const captureResult = await this.captureOrderPaypal(
      transaction.transaction_code,
    );
    if (captureResult.status !== 'COMPLETED') {
      throw new InternalServerErrorException(
        'Payment not completed on PayPal',
      );
    }
    return this.handleReturnSuccess(transaction);
  }

  async handleReturnCancelPaypal(transactionCode: string) {
    const transaction = await this.getTransactionByOrderId(transactionCode);
    if (transaction.status !== StatusOrder.PENDING) {
      throw new NotFoundException('Transaction is not in pending state');
    }
    return this.handleReturnFailed(transaction);
  }

  // async createRefund({ orderId }: { orderId: number }) {
  //     const accessToken = await this.generateAccessToken();
  //     const refund = await this.orderRefundRepository.findOne({
  //         where: { order: { id: orderId }, payment_gateway: PaymentGateway.PAYPAL },
  //         relations: ['order'],
  //     });

  //     if (!refund) {
  //         throw new NotFoundException('Refund record not found');
  //     }

  //     try {
  //         // Use the capture ID stored in request_id field from the refund record
  //         const captureId = refund.request_id || refund.transaction_code;

  //         const res = await axios.post(
  //             `${this.configService.get<string>('paypal.baseUrl')}/v2/payments/captures/${captureId}/refund`,
  //             {
  //                 amount: {
  //                     value: changeVnToUSD(refund.order.total_prices.toString()),
  //                     currency_code: refund.currency_code || 'USD',
  //                 },
  //             },
  //             {
  //                 headers: {
  //                     'Content-Type': 'application/json',
  //                     Authorization: `Bearer ${accessToken}`,
  //                 },
  //             }
  //         );
  //         //  update status of refund
  //             refund.refund_status = RefundStatus.SUCCESS;
  //             await this.orderRefundRepository.save(refund);
  //         return res.data;
  //     } catch (error) {
  //         throw new InternalServerErrorException(
  //             'Refund request failed: ' + (error?.response?.data?.message || error.message)
  //         );
  //     }
  // }

  async queryOrderStatusPaypal(orderId: string) {
    const accessToken = await this.generateAccessToken();
    if (!accessToken) {
      throw new InternalServerErrorException(
        'Failed to generate PayPal access token',
      );
    }

    const response = await axios.get(
      `${this.configService.get<string>('paypal.baseUrl')}/v2/checkout/orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const data = response.data;

    return {
      method: PaymentGateway.PAYPAL,
      status: data.status,
      paid: data.status === 'COMPLETED',
      total: data.purchase_units[0].amount.value,
      currency: data.purchase_units[0].amount.currency_code || 'USD',
    };
  }
}
