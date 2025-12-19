

import { Roles } from '@common/decorator/roles.decorator';
import { Role } from '@common/enums/roles.enum';
import { JwtAuthGuard } from '@common/guards/jwt.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { UserPaginationDto } from '@common/pagination/dto/user/userPagination.dto';
import { UserService } from './user.service';
import { UpdateUserDto } from './dtos/update-user.dto';
import { Controller, UseGuards, Get, Query, Param, Put, Body, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ScanQrCodeDto } from '@modules/order/dto/qrcode.dto';


@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) { }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Get all users for admin' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  findAll(@Query() query: UserPaginationDto) {
    const { page = 1, take = 10, ...restFilters } = query;

    return this.userService.findAllUsers({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
  }
  
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (admin only)' })
  findOne(@Param('id') id: string) {
    return this.userService.findUserById(id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id')
  @ApiOperation({ summary: 'Update user by ID (admin only)' })
  @ApiBody({ type: UpdateUserDto })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUser(id, updateUserDto);
  }
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore user by ID (admin only)' })
  deleteUser(@Param('id') id: string) {
    return this.userService.retoreUser(id);
  }
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/soft-delete')
  @ApiOperation({ summary: 'Soft delete user by ID (admin only)' })
  toggleStatus(@Param('id') id: string) {
    return this.userService.softDeleteUser(id);
  }
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('delete/:id')
  @ApiOperation({ summary: 'Delete user by ID (admin only)' })
  delete(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }

    @UseGuards( RolesGuard)
    @Roles(Role.ADMIN, Role.EMPLOYEE)
    @Post('qrcode')
    @ApiOperation({ summary: 'Get QR code for current user (image)' })
    @ApiBody({ type: ScanQrCodeDto, description: 'QR code data' })
    async getQrCode(@Body() body: ScanQrCodeDto) {
      return this.userService.getQrCode(body.qrCode);
    }


  
}