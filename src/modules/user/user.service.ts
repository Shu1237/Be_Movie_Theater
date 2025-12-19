import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BadRequestException } from '@nestjs/common';
import { Role } from '@database/entities/user/roles';
import { applySorting } from '@common/pagination/apply_sort';
import { applyCommonFilters } from '@common/pagination/applyCommonFilters';
import { applyPagination } from '@common/pagination/applyPagination';
import { UserPaginationDto } from '@common/pagination/dto/user/userPagination.dto';
import { userFieldMapping } from '@common/pagination/fillters/user-filed-mapping';
import { buildPaginationResponse } from '@common/pagination/pagination-response';
import { JWTUserType } from '@common/utils/type';
import { User } from '@database/entities/user/user';
import { UpdateUserDto } from './dtos/update-user.dto';
import { Order } from '@database/entities/order/order';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) { }

  private UserMapping (user:User){
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      status: user.status,
      score: user.score,
      avatar: user.avatar,
      provider: user.provider,
      role: user.role.role_name
    }
  }

  async findAllUsers(filters: UserPaginationDto): Promise<ReturnType<typeof buildPaginationResponse>> {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role');

    applyCommonFilters(qb, filters, userFieldMapping);

    const allowedFields = [
      'user.username',
      'user.email',
      'user.status',
      'role.name',
      'user.score',
      'user.created_at',
    ];

    applySorting(
      qb,
      filters.sortBy,
      filters.sortOrder,
      allowedFields,
      'user.created_at',
    );

    applyPagination(qb, {
      page: filters.page,
      take: filters.take,
    });

    const [users, total] = await qb.getManyAndCount();
    const counts: { activeCount: number; inactiveCount: number } = await this.userRepository
      .createQueryBuilder('user')
      .select([
        `SUM(CASE WHEN user.status = true THEN 1 ELSE 0 END) AS activeCount`,
        `SUM(CASE WHEN user.status = false THEN 1 ELSE 0 END) AS inactiveCount`,
      ])
      .getRawOne() || { activeCount: 0, inactiveCount: 0 };
    const accountActivity = Number(counts.activeCount) || 0;
    const accountInactivity = Number(counts.inactiveCount) || 0;
    return buildPaginationResponse(users.map(this.UserMapping), {
      total,
      page: filters.page,
      take: filters.take,
      accountActivity,
      accountInactivity,
    });
  }




  async findUserById(id: string): Promise<ReturnType<typeof this.UserMapping>> {
    const user =  await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    } 
    return this.UserMapping(user);
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<ReturnType<typeof this.UserMapping>> {
      await this.userRepository.update(id, updateUserDto);
      return this.findUserById(id);
  }

  async retoreUser(id: string): Promise<void> {
     const user = await this.findUserById(id);
     if (!user.status) {
       throw new BadRequestException(
         `User with ID ${id} is already active`,
         'USER_ALREADY_ACTIVE',
       );
     }
     await this.userRepository.update(id,{ status: true });
  } 

  
  async softDeleteUser(id: string): Promise<void> {
     const user = await this.findUserById(id);
     if (!user.status) {
       throw new BadRequestException(
         `User with ID ${id} is already not active`,
         'USER_ALREADY_BANNED',
       );
     }
     await this.userRepository.update(id,{ status: false });
  } 
  async deleteUser (id: string): Promise<void>{
    // check order 
    const checkorders = await this.orderRepository.findOneBy({customer_id: id});
    if (checkorders) {
      throw new BadRequestException(
        `User with ID ${id} has associated orders and cannot be deleted`,
        'USER_HAS_ORDERS',
      );
    }
    await this.userRepository.delete(id);
  }


    async getQrCode(userId: string): Promise<JWTUserType> {
      const user = await this.userRepository.findOne({
        where: { id: userId, status: true },
        relations: ['role'],
      });
      
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const payload: JWTUserType = {
        account_id: user.id,
        role_id: user.role.role_id,
        username: user.username,
        email: user.email,
        provider: user.provider,
      };
      return payload;
    }
}
