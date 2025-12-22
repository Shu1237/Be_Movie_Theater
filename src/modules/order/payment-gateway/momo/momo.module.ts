import { Module } from '@nestjs/common';
import { MomoService } from './momo.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Transaction } from '@database/entities/order/transaction';
import { MyGateWayModule } from '@common/gateways/seat.gateway.module';
import { MailModule } from '@common/mail/mail.module';
import { QrCodeModule } from '@common/qrcode/qr.module';
import { ScheduleSeat } from '@database/entities/cinema/schedule_seat';
import { HistoryScore } from '@database/entities/order/history_score';
import { Order } from '@database/entities/order/order';
import { OrderExtra } from '@database/entities/order/order-extra';
import { Ticket } from '@database/entities/order/ticket';
import { User } from '@database/entities/user/user';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderExtra,
      Transaction,
      Order,
      Ticket,
      ScheduleSeat,
      HistoryScore,
      User,
    ]),
    MailModule,
    MyGateWayModule,
    QrCodeModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
      }),
    }),
  ],

  controllers: [],
  providers: [MomoService],
  exports: [MomoService],
})
export class MomoModule {}
