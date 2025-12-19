import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { ResponseDetail } from '@common/response/response-detail-create-update';
import { ResponseMsg } from '@common/response/response-message';
import { PaymentMethod } from '@database/entities/order/payment-method';


@Injectable()
export class PaymentMethodService {
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
  ) {}

  async create(createPaymentMethodDto: CreatePaymentMethodDto) :Promise<ResponseDetail<PaymentMethod>> {
    const exists = await this.paymentMethodRepository.findOne({
      where: { name: createPaymentMethodDto.name, is_deleted: false },
    });
    if (exists) {
      throw new BadRequestException(
        `Payment method with name "${createPaymentMethodDto.name}" already exists.`,
      );
    }
    const paymentMethod = this.paymentMethodRepository.create(
      createPaymentMethodDto,
    );
    const savedPaymentMethod = await this.paymentMethodRepository.save(paymentMethod);
    return ResponseDetail.ok(savedPaymentMethod)
  }

  async findAll() {
    return this.paymentMethodRepository.find({ where: { is_deleted: false } });
  }

  async findOne(id: number) : Promise<ResponseDetail<PaymentMethod>> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id, is_deleted: false },
    });
    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }
    return ResponseDetail.ok(paymentMethod)
  }

  async update(id: number, updatePaymentMethodDto: UpdatePaymentMethodDto) : Promise<ResponseDetail<PaymentMethod | null>> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id, is_deleted: false },
    });
    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }
     await this.paymentMethodRepository.update(id, updatePaymentMethodDto);
    const updatedPaymentMethod = await this.paymentMethodRepository.findOne({ where: { id } });
    return ResponseDetail.ok(updatedPaymentMethod)
  }

  async remove(id: number) :Promise<ResponseMsg> {
    const result = await this.paymentMethodRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }
    return ResponseMsg.ok('Payment method deleted successfully');
  }

  async softDelete(id: number) : Promise<ResponseMsg> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id, is_deleted: false },
    });
    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }
    paymentMethod.is_deleted = true;
    await this.paymentMethodRepository.save(paymentMethod);
    return ResponseMsg.ok('Payment method soft deleted successfully');
  }

  async restore(id: number): Promise<ResponseMsg> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id },
    });
    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }
    if (!paymentMethod.is_deleted) {
      throw new BadRequestException(
        `Payment method with ID ${id} is not soft-deleted`,
      );
    }
    paymentMethod.is_deleted = false;
    await this.paymentMethodRepository.save(paymentMethod);
    return ResponseMsg.ok('Payment method restored successfully');
  }
}
