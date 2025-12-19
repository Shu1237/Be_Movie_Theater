import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MyGateWayModule } from '@common/gateways/seat.gateway.module';
import { RedisModule } from '@common/redis/redis.module';
import { Schedule } from '@database/entities/cinema/schedule';
import { ScheduleSeat } from '@database/entities/cinema/schedule_seat';
import { SeatType } from '@database/entities/cinema/seat-type';
import { Combo } from '@database/entities/item/combo';
import { Drink } from '@database/entities/item/drink';
import { Food } from '@database/entities/item/food';
import { Product } from '@database/entities/item/product';
import { DailyTransactionSummary } from '@database/entities/order/daily_transaction_summary';
import { HistoryScore } from '@database/entities/order/history_score';
import { Order } from '@database/entities/order/order';
import { OrderDetail } from '@database/entities/order/order-detail';
import { OrderExtra } from '@database/entities/order/order-extra';
import { PaymentMethod } from '@database/entities/order/payment-method';
import { Ticket } from '@database/entities/order/ticket';
import { TicketType } from '@database/entities/order/ticket-type';
import { Promotion } from '@database/entities/promotion/promotion';
import { User } from '@database/entities/user/user';
import { SeatModule } from '@modules/seat/seat.module';
import { TicketModule } from '@modules/ticket/ticket.module';

import { MomoModule } from './payment-menthod/momo/momo.module';
import { PayPalModule } from './payment-menthod/paypal/paypal.module';
import { VisaModule } from './payment-menthod/visa/visa.module';
import { VnpayModule } from './payment-menthod/vnpay/vnpay.module';
import { ZalopayModule } from './payment-menthod/zalopay/zalopay.module';
import { Transaction } from '@database/entities/order/transaction';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      Promotion,
      Ticket,
      TicketType,
      Schedule,
      User,
      SeatType,
      Order,
      OrderDetail,
      Transaction,
      PaymentMethod,
      ScheduleSeat,
      Product,
      Food,
      Drink,
      Combo,
      OrderExtra,
      HistoryScore,
      DailyTransactionSummary,
    ]),
    MomoModule,
    PayPalModule,
    VisaModule,
    VnpayModule,
    ZalopayModule,
    SeatModule,
    RedisModule,
    MyGateWayModule,
    TicketModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
      }),
    }),
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
