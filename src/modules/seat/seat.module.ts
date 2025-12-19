import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeatController } from './seat.controller';
import { SeatTypeController } from './seat-type.controller';
import { SeatService } from './seat.service';
import { SeatTypeService } from './seat-type.service';
import { RedisModule } from '@common/redis/redis.module';
import { CinemaRoom } from '@database/entities/cinema/cinema-room';
import { Schedule } from '@database/entities/cinema/schedule';
import { ScheduleSeat } from '@database/entities/cinema/schedule_seat';
import { Seat } from '@database/entities/cinema/seat';
import { SeatType } from '@database/entities/cinema/seat-type';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      Seat,
      SeatType,
      CinemaRoom,
      Schedule,
      ScheduleSeat,
    ]),
    RedisModule,
  ],
  controllers: [SeatController, SeatTypeController],
  providers: [SeatService, SeatTypeService],
  exports: [SeatService, SeatTypeService],
})
export class SeatModule {}
