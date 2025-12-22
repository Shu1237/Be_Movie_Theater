import { Injectable } from '@nestjs/common';
import { AudienceType } from '@common/enums/audience_type.enum';
import { ProductTypeEnum } from '@common/enums/product.enum';
import { applyAudienceDiscount, calculateProductTotal, roundUpToNearest } from '@common/utils/helper';
import { OrderBillType, SeatInfo } from '@common/utils/type';
import { ScheduleSeat } from '@database/entities/cinema/schedule_seat';
import { Product } from '@database/entities/item/product';
import { Combo } from '@database/entities/item/combo';
import { TicketType } from '@database/entities/order/ticket-type';
import { Promotion } from '@database/entities/promotion/promotion';

export interface PriceBreakdown {
  totalSeats: number;
  totalProduct: number;
  totalBeforePromotion: number;
  promotionAmount: number;
  totalPrice: number;
  seatDiscount: number;
  productDiscount: number;
  seatPriceMap: Map<string, number>;
}

export interface ProductWithTotal {
  product: Product;
  quantity: number;
  total: number;
}

@Injectable()
export class OrderCalculationService {
  calculateSeatPrices(
    orderBillSeats: SeatInfo[],
    scheduleSeats: ScheduleSeat[],
    ticketTypes: TicketType[],
  ): { totalSeats: number; seatPriceMap: Map<string, number> } {
    let totalSeats = 0;
    const seatPriceMap = new Map<string, number>();

    for (const seatData of orderBillSeats) {
      const seat = scheduleSeats.find((s) => s.seat.id === seatData.id);
      if (!seat) {
        throw new Error(`Seat ${seatData.id} not found`);
      }

      const ticketType = ticketTypes.find(
        (t) =>
          (t.audience_type as AudienceType) ===
          (seatData.audience_type as AudienceType),
      );
      const discount = parseFloat(ticketType?.discount ?? '0');

      const basePrice = seat.seat.seatType.seat_type_price;
      const finalPrice = applyAudienceDiscount(basePrice, discount);

      seatPriceMap.set(seatData.id, finalPrice);
      totalSeats += finalPrice;
    }

    return { totalSeats, seatPriceMap };
  }

  calculateProductPrices(
    orderExtras: Product[],
    orderBill: OrderBillType,
  ): number {
    if (orderExtras.length === 0) {
      return 0;
    }
    return calculateProductTotal(orderExtras, orderBill);
  }

  calculatePromotionDiscount(
    promotion: Promotion,
    totalBeforePromotion: number,
  ): { promotionAmount: number; isPercentage: boolean } {
    const promotionDiscount = parseFloat(promotion?.discount ?? '0');
    const isPercentage = promotion?.promotionType?.type === 'percentage';

    const promotionAmount = isPercentage
      ? Math.round(totalBeforePromotion * (promotionDiscount / 100))
      : Math.round(promotionDiscount);

    return { promotionAmount, isPercentage };
  }

  calculateTotalPrice(
    orderBillSeats: SeatInfo[],
    scheduleSeats: ScheduleSeat[],
    ticketTypes: TicketType[],
    orderExtras: Product[],
    orderBill: OrderBillType,
    promotion: Promotion,
  ): PriceBreakdown {
    const { totalSeats, seatPriceMap } = this.calculateSeatPrices(
      orderBillSeats,
      scheduleSeats,
      ticketTypes,
    );

    const totalProduct = this.calculateProductPrices(orderExtras, orderBill);

    const totalBeforePromotion = totalSeats + totalProduct;

    const { promotionAmount, isPercentage } = this.calculatePromotionDiscount(
      promotion,
      totalBeforePromotion,
    );

    const totalPrice = roundUpToNearest(
      totalBeforePromotion - promotionAmount,
      1000,
    );

    const seatRatio = totalSeats / totalBeforePromotion;
    const seatDiscount = Math.round(promotionAmount * seatRatio);
    const productDiscount = promotionAmount - seatDiscount;

    return {
      totalSeats,
      totalProduct,
      totalBeforePromotion,
      promotionAmount,
      totalPrice,
      seatDiscount,
      productDiscount,
      seatPriceMap,
    };
  }

  calculateProductTotals(
    orderExtras: Product[],
    orderBill: OrderBillType,
  ): ProductWithTotal[] {
    return orderExtras.map((p) => {
      const quantity =
        orderBill.products?.find((item) => item.product_id === p.id)
          ?.quantity || 0;
      return {
        product: p,
        quantity,
        total: Number(p.price) * quantity,
      };
    });
  }

  calculateProductUnitPrice(
    item: ProductWithTotal,
    productDiscount: number,
    totalProductBeforePromo: number,
    isPercentage: boolean,
  ): number {
    const shareRatio = item.total / totalProductBeforePromo || 0;
    const isCombo =
      (item.product.category as ProductTypeEnum) === ProductTypeEnum.COMBO;

    const basePrice = Number(item.product.price);
    let unit_price_after_discount = basePrice;

    if (isPercentage) {
      const unitDiscount =
        basePrice * (productDiscount / totalProductBeforePromo);
      unit_price_after_discount = Math.round(basePrice - unitDiscount);
    } else {
      const productDiscountShare = productDiscount * shareRatio;
      const unitDiscount = productDiscountShare / item.quantity;
      unit_price_after_discount = Math.round(basePrice - unitDiscount);
    }

    if (isCombo) {
      const comboProduct = item.product as Combo;
      if (comboProduct.discount != null && !isNaN(comboProduct.discount)) {
        unit_price_after_discount *= 1 - comboProduct.discount / 100;
      }
    }

    return roundUpToNearest(unit_price_after_discount, 1000);
  }

  calculateSeatFinalPrice(
    seatId: string,
    seatPriceMap: Map<string, number>,
    totalSeats: number,
    seatDiscount: number,
  ): number {
    const priceBeforePromo = seatPriceMap.get(seatId)!;
    const shareRatio = priceBeforePromo / totalSeats;
    const promotionDiscountForThisSeat = seatDiscount * shareRatio;
    return Math.round(priceBeforePromo - promotionDiscountForThisSeat);
  }

  calculateOrderScore(totalPrice: number, promotionExchange: number): number {
    const orderScore = Math.floor(totalPrice / 1000);
    return orderScore - promotionExchange;
  }




}
