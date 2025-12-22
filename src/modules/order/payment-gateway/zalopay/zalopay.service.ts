import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import  crypto from 'crypto';
import axios from 'axios';
import  moment from 'moment';
import  dayjs from 'dayjs';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { PaymentGateway } from '@common/enums/payment_gatewat.enum';
import { StatusOrder } from '@common/enums/status-order.enum';
import { MyGateWay } from '@common/gateways/seat.gateway';
import { MailService } from '@common/mail/mail.service';
import { QrCodeService } from '@common/qrcode/qrcode.service';
import { OrderBillType } from '@common/utils/type';
import { ScheduleSeat } from '@database/entities/cinema/schedule_seat';
import { HistoryScore } from '@database/entities/order/history_score';
import { Order } from '@database/entities/order/order';
import { OrderExtra } from '@database/entities/order/order-extra';
import { Ticket } from '@database/entities/order/ticket';
import { User } from '@database/entities/user/user';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { AbstractPaymentService } from '../base/abstract-payment.service';
import { Transaction } from '@database/entities/order/transaction';


@Injectable()
export class ZalopayService extends AbstractPaymentService {
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

  async createOrderZaloPay(orderItem: OrderBillType) {
    const app_id = this.configService.get<string>('zalopay.appId');
    const key1 = this.configService.get<string>('zalopay.key1');
    const endpoint = this.configService.get<string>('zalopay.endpoint');
    const callback_url = this.configService.get<string>('zalopay.returnUrl');

    if (!app_id || !key1 || !endpoint) {
      throw new InternalServerErrorException(
        'ZaloPay configuration is missing',
      );
    }

    if (
      !orderItem ||
      !Array.isArray(orderItem.seats) ||
      orderItem.seats.length === 0
    ) {
      throw new InternalServerErrorException('No seat selected');
    }

    const transID = Date.now();
    const app_trans_id = `${moment().format('YYMMDD')}_${transID}`;
    const app_time = dayjs().valueOf();
    const embed_data = {
      redirecturl: callback_url,
      preferred_payment_method: [],
    };

    const rawData = {
      app_id: Number(app_id),
      app_trans_id,
      app_user: 'ZaloPay Movie Theater',
      amount: Number(orderItem.total_prices),
      app_time,
      item: JSON.stringify([
        {
          itemid: `order_${app_id}`,
          itemname: 'Order payment for movie tickets',
          itemprice: Number(orderItem.total_prices),
          itemquantity: 1,
        },
      ]),
      embed_data: JSON.stringify(embed_data),
      description: 'Order payment for movie tickets',
      bank_code: '',
    };

    const dataToMac = [
      rawData.app_id,
      rawData.app_trans_id,
      rawData.app_user,
      rawData.amount,
      rawData.app_time,
      rawData.embed_data,
      rawData.item,
    ].join('|');

    const mac = crypto
      .createHmac('sha256', key1)
      .update(dataToMac)
      .digest('hex');

    const requestBody = {
      ...rawData,
      mac,
    };

    try {
      const res = await axios.post(endpoint, requestBody, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.data.return_code !== 1) {
        throw new InternalServerErrorException(
          `ZaloPay error: ${res.data.sub_return_message}`,
        );
      }
      return {
        payUrl: res.data.order_url,
        orderId: app_trans_id,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'ZaloPay API failed: ' +
          (error.response?.data?.sub_return_message || error.message),
      );
    }
  }

  async handleReturnZaloPay(query: any) {
    const { apptransid, status } = query;
    const transaction = await this.getTransactionByOrderId(apptransid);

    if (transaction.status !== StatusOrder.PENDING) {
      throw new NotFoundException('Transaction is not in pending state');
    }

    if (status === '1') {
      return this.handleReturnSuccess(transaction);
    } else {
      return this.handleReturnFailed(transaction);
    }
  }

  // async createRefund() {
  //   const { zp_trans_id, amount, description, refund_fee_amount } = params;

  //   const app_id = this.configService.get<string>('zalopay.appId');
  //   const key1 = this.configService.get<string>('zalopay.key1');
  //   const endpoint = this.configService.get<string>('zalopay.refundEndpoint');

  //   if (!app_id || !key1 || !endpoint) {
  //     throw new InternalServerErrorException('ZaloPay refund config is missing');
  //   }

  //   const m_refund_id = `${moment().format('YYMMDD')}_${app_id}_${Date.now()}`;
  //   const timestamp = Date.now();

  //   // Build MAC input
  //   let hmacInput: string;
  //   if (typeof refund_fee_amount === 'number') {
  //     hmacInput = `${app_id}|${zp_trans_id}|${amount}|${refund_fee_amount}|${description}|${timestamp}`;
  //   } else {
  //     hmacInput = `${app_id}|${zp_trans_id}|${amount}|${description}|${timestamp}`;
  //   }

  //   const mac = crypto.createHmac('sha256', key1).update(hmacInput).digest('hex');

  //   const requestBody: any = {
  //     m_refund_id,
  //     app_id: Number(app_id),
  //     zp_trans_id,
  //     amount,
  //     timestamp,
  //     description,
  //     mac,
  //   };

  //   if (typeof refund_fee_amount === 'number') {
  //     requestBody.refund_fee_amount = refund_fee_amount;
  //   }

  //   try {
  //     const response = await axios.post(endpoint, requestBody, {
  //       headers: { 'Content-Type': 'application/json' },
  //     });

  //     return response.data;
  //   } catch (error) {
  //     console.error('ZaloPay refund error:', error?.response?.data || error.message);
  //     throw new InternalServerErrorException(
  //       'ZaloPay refund API failed: ' +
  //       (error?.response?.data?.sub_return_message || error.message),
  //     );
  //   }
  // }

  async queryOrderStatusZaloPay(app_trans_id: string) {
    const app_id = this.configService.get<string>('zalopay.appId');
    const key1 = this.configService.get<string>('zalopay.key1');
    const endpoint = this.configService.get<string>('zalopay.queryUrl');
    if (!app_id || !key1 || !endpoint) {
      throw new InternalServerErrorException(
        'ZaloPay configuration is missing',
      );
    }

    const dataToSign = `${app_id}|${app_trans_id}|${key1}`;
    const mac = crypto
      .createHmac('sha256', key1)
      .update(dataToSign)
      .digest('hex');

    const body = {
      app_id: +app_id,
      app_trans_id,
      mac,
    };

    try {
      const res = await axios.post(endpoint, body, {
        headers: { 'Content-Type': 'application/json' },
      });

      const data = res.data;

      return {
        method: PaymentGateway.ZALOPAY,
        status:
          data.return_code === 1 && data.sub_return_code === 1
            ? 'PAID'
            : 'UNPAID',
        paid: data.sub_return_code === 1,
        total: data.amount,
        currency: 'VND',
      };
    } catch (error) {
      throw new Error(
        `Failed to query ZaloPay order: ${error.response?.data?.message || error.message}`,
      );
    }
  }
}
