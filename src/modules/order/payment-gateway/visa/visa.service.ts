import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { PaymentGateway } from '@common/enums/payment_gateway.enum';
import { StatusOrder } from '@common/enums/status-order.enum';
import { MyGateWay } from '@common/gateways/seat.gateway';
import { MailService } from '@common/mail/mail.service';
import { QrCodeService } from '@common/qrcode/qrcode.service';
import { changeVNtoUSDToCent } from '@common/utils/helper';
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
export class VisaService extends AbstractPaymentService {
  private stripe: Stripe;

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
    this.stripe = new Stripe(
      this.configService.get<string>('visa.secretKey') as string,
    );
  }

  async createOrderVisa(orderBill: OrderBillType) {
    const session = await this.stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Order Bill Payment by Visa',
            },
            unit_amount: changeVNtoUSDToCent(orderBill.total_prices),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${this.configService.get<string>('visa.successUrl')}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get<string>('visa.cancelUrl')}?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        payment_method_id: orderBill.payment_method_id,
        promotion_id: orderBill.promotion_id.toString(),
        schedule_id: orderBill.schedule_id.toString(),
        total_prices: orderBill.total_prices,
      },
    });
    if(!session || !session.id || !session.url) {
      throw new InternalServerErrorException('Failed to create Stripe session');
    }
    const url = {
      payUrl: session.url,
      orderId: session.id,
    };
    return url;
  }

  async retrieveSession(sessionId: string) {
    return await this.stripe.checkout.sessions.retrieve(sessionId);
  }

  async handleReturnSuccessVisa(sessionId: string) {
    const transaction = await this.getTransactionByOrderId(sessionId);
    if (transaction.status !== StatusOrder.PENDING) {
      throw new NotFoundException('Transaction is not in pending state');
    }
    const session = await this.retrieveSession(sessionId);
    if (session.payment_status !== 'paid') {
      throw new InternalServerErrorException(
        'Payment not completed on Stripe',
      );
    }
    return this.handleReturnSuccess(transaction);
  }

  async handleReturnCancelVisa(sessionId: string) {
    const transaction = await this.getTransactionByOrderId(sessionId);
    if (transaction.status !== StatusOrder.PENDING) {
      throw new NotFoundException('Transaction is not in pending state');
    }
    return this.handleReturnFailed(transaction);
  }

  // async createRefund({ orderId }: { orderId: number }) {
  //     const refund = await this.orderRefundRepository.findOne({
  //         where: { order: { id: orderId }, payment_gateway: PaymentGateway.VISA },
  //         relations: ['order'],
  //     });

  //     if (!refund) {
  //         throw new NotFoundException('Refund record not found');
  //     }

  //     // If payment_intent_id is not available, try to get it from session
  //     let paymentIntentId = refund.payment_intent_id;

  //     if (!paymentIntentId && refund.order_ref_id) {
  //         try {
  //             const session = await this.stripe.checkout.sessions.retrieve(refund.order_ref_id);
  //             paymentIntentId = session.payment_intent as string;

  //             // Update refund record with payment_intent_id
  //             if (paymentIntentId) {
  //                 refund.payment_intent_id = paymentIntentId;
  //                 await this.orderRefundRepository.save(refund);
  //             }
  //         } catch (error) {
  //             console.error('Error retrieving session:', error);
  //             throw new InternalServerErrorException('Failed to retrieve session for refund');
  //         }
  //     }

  //     if (!paymentIntentId) {
  //         throw new InternalServerErrorException('Missing payment_intent_id to refund Stripe');
  //     }

  //     try {
  //         const refundStripe = await this.stripe.refunds.create({
  //             payment_intent: paymentIntentId,
  //             amount: changeVNtoUSDToCent(refund.refund_amount.toString()), // Convert VND to USD cents
  //         });

  //         if (refundStripe.status !== 'succeeded') {
  //             throw new InternalServerErrorException(`Refund failed: ${refundStripe.status}`);
  //         }

  //         refund.refund_status = RefundStatus.SUCCESS;
  //         refund.timestamp = Math.floor(new Date().getTime() / 1000);

  //         await this.orderRefundRepository.save(refund);

  //     } catch (error) {
  //         throw new InternalServerErrorException('Stripe refund failed: ' + error.message);
  //     }
  // }
  async queryOrderStatusVisa(orderId: string) {
    const session = await this.stripe.checkout.sessions.retrieve(orderId, {
      expand: ['payment_intent'],
    });

    return {
      method: PaymentGateway.VISA,
      status: session.payment_status?.toUpperCase() || 'UNKNOWN',
      paid: session.payment_status === 'paid',
      total: (session.amount_total ? session.amount_total / 100 : 0).toFixed(2),
      currency: session.currency || 'USD',
    };
  }
}
