import { Module } from '@nestjs/common';
import { OrderCronService } from './order/orderCron.service';
import { MovieExpireCheckService } from './movie/movieExpireCheck.service';
import { ScheduleExpireCheckService } from './schedule/scheduleExpireCheck.service';
import { ReportService } from './daily-transaction/daily-transaction.service';
import { MyGateWayModule } from '@common/gateways/seat.gateway.module';
import { RedisModule } from '@common/redis/redis.module';
import { Movie } from '@database/entities/cinema/movie';
import { Schedule } from '@database/entities/cinema/schedule';
import { ScheduleSeat } from '@database/entities/cinema/schedule_seat';
import { Order } from '@database/entities/order/order';
import { OrderExtra } from '@database/entities/order/order-extra';
import { Promotion } from '@database/entities/promotion/promotion';
import { OrderModule } from '@modules/order/order.module';
import { SeatModule } from '@modules/seat/seat.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '@database/entities/order/transaction';
import { PromotionCronService } from './promotion/PromotionCron.Service';


@Module({
  imports: [
    RedisModule,
    MyGateWayModule,
    SeatModule,
    TypeOrmModule.forFeature([
      ScheduleSeat,
      Schedule,
      Movie,
      Order,
      Promotion,
      OrderExtra,
      Transaction,
    ]),
    OrderModule,
  ],
  providers: [
    MovieExpireCheckService,
    ScheduleExpireCheckService,
    OrderCronService,
    PromotionCronService,
    ReportService,
  ],
})
export class CronModule {}
