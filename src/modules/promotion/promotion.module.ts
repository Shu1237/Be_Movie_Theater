import { Module } from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { PromotionController } from './promotion.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromotionCronService } from '@common/cron/promotion/PromotionCron.Service';
import { Promotion } from '@database/entities/promotion/promotion';
import { PromotionType } from '@database/entities/promotion/promtion_type';
import { User } from '@database/entities/user/user';


@Module({
  imports: [TypeOrmModule.forFeature([User, Promotion, PromotionType])],
  controllers: [PromotionController],
  providers: [PromotionService, PromotionCronService],
})
export class PromotionModule {}
