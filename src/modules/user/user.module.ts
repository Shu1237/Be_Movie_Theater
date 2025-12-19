import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@database/entities/user/user';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { Order } from '@database/entities/order/order';

@Module({
  imports: [TypeOrmModule.forFeature([User, Order])],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
