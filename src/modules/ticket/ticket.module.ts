import { Module } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from '@database/entities/order/ticket';
import { User } from '@database/entities/user/user';


@Module({
  imports: [TypeOrmModule.forFeature([Ticket, User])],
  controllers: [TicketController],
  providers: [TicketService],
  exports: [TicketService],
})
export class TicketModule {}
