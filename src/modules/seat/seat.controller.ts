import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
  Patch,
  Query,
  Delete,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { SeatService } from './seat.service';
import { BulkCreateSeatDto } from './dto/BulkCreateSeatDto';
import { BulkSeatOperationDto } from './dto/BulkSeatOperationDto';
import { Roles } from '@common/decorator/roles.decorator';
import { Role } from '@common/enums/roles.enum';
import { JwtAuthGuard } from '@common/guards/jwt.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { SeatPaginationDto } from '@common/pagination/dto/seat/seatPagination.dto';
import { BulkSeatIdsDto } from './dto/BulkSeatIdsDto';


@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('seat')
export class SeatController {
  constructor(private readonly seatService: SeatService) { }

  // GET - Get list of seats for user
  @Get('user')
  @ApiOperation({ summary: 'Get all seats for users' })
  async getAllSeatsUser() {
    return await this.seatService.getAllSeatsUser();
  }

  // GET - Get list of seats for admin (with pagination)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get('admin')
  @ApiOperation({ summary: 'Get all seats for admin' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  getAllSeats(@Query() query: SeatPaginationDto) {
    const { page = 1, take = 10, ...restFilters } = query;
    return this.seatService.getAllSeats({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
  }

  // GET - Get seats by room ID
  @Get('room/:roomId')
  @ApiOperation({ summary: 'Get seats by room ID' })
  getSeatsByRoom(@Param('roomId') roomId: string) {
    return this.seatService.getSeatsByRoom(roomId);
  }
  // POST - Create seats in bulk
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('bulk')
  @ApiOperation({ summary: 'Create Seat By Row & Col' })
  createSeatsBulk(@Body() dto: BulkCreateSeatDto) {
    return this.seatService.createSeatsBulk(dto);
  }

  // PUT - Bulk update multiple seats (PUT THIS BEFORE DYNAMIC ROUTES)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Put('bulk-update')
  @ApiOperation({ summary: 'Bulk update multiple seats (admin only)' })
  @ApiBody({ type: BulkSeatOperationDto })
  async bulkUpdateSeats(
    @Body() dto: BulkSeatOperationDto) {
    return this.seatService.bulkUpdateSeats(dto);
  }

  // DELETE - Bulk soft delete multiple seats (admin only)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('bulk-delete')
  @ApiOperation({ summary: 'Bulk soft delete multiple seats (admin only)' })
  @ApiBody({ type: BulkSeatIdsDto })
  async bulkDeleteSeats(
    @Body() dto: BulkSeatIdsDto) {
    return this.seatService.bulkDeleteSeats(dto);
  }

  // PATCH - Restore soft-deleted seats
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('bulk-restore')
  @ApiOperation({ summary: 'Bulk restore multiple soft deleted seats (admin only)' })
  @ApiBody({ type: BulkSeatIdsDto })
  async bulkRestoreSeats(
    @Body() dto: BulkSeatIdsDto) {
    return this.seatService.bulkRestoreSeats(dto);
  }

  //PATCH - Toggle seat status (delete/restore) by ID
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle seat status (delete/restore) by ID (Admin only)' })
  toggleSeatStatus(@Param('id') id: string) {
    return this.seatService.toggleSeatStatus(id);
  }
}
