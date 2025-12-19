import { Module } from '@nestjs/common';

import { MyGateWay } from './seat.gateway';
import { SeatModule } from '@modules/seat/seat.module';

@Module({
  imports: [SeatModule],
  providers: [MyGateWay],
  exports: [MyGateWay],
})
export class MyGateWayModule {}
