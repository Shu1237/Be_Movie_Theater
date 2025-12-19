import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Combo } from '@database/entities/item/combo';
import { Drink } from '@database/entities/item/drink';
import { Food } from '@database/entities/item/food';
import { Product } from '@database/entities/item/product';


@Module({
  imports: [TypeOrmModule.forFeature([Product, Combo, Food, Drink])],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
