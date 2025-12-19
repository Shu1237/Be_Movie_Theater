import { Module, Version } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule } from '@database/entities/cinema/schedule';
import { CinemaRoom } from '@database/entities/cinema/cinema-room';
import { Movie } from '@database/entities/cinema/movie';


@Module({
  imports: [TypeOrmModule.forFeature([Schedule, Movie, CinemaRoom, Version])],
  controllers: [ScheduleController],
  providers: [ScheduleService],
})
export class ScheduleModule {}
