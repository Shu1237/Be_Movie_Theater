import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OverviewController } from './overview.controller';
import { OverviewService } from './overview.service';
import { Movie } from '@database/entities/cinema/movie';
import { Schedule } from '@database/entities/cinema/schedule';
import { DailyTransactionSummary } from '@database/entities/order/daily_transaction_summary';
import { Order } from '@database/entities/order/order';
import { OrderExtra } from '@database/entities/order/order-extra';
import { Ticket } from '@database/entities/order/ticket';
import { TicketType } from '@database/entities/order/ticket-type';
import { User } from '@database/entities/user/user';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      User,
      Movie,
      Ticket,
      TicketType,
      Schedule,
      OrderExtra,
      DailyTransactionSummary,
    ]),
  ],
  controllers: [OverviewController],
  providers: [OverviewService],
})
export class OverviewModule {}
