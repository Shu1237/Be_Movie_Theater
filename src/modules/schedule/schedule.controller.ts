import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Put,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Roles } from '@common/decorator/roles.decorator';
import { Role } from '@common/enums/roles.enum';
import { JwtAuthGuard } from '@common/guards/jwt.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { SchedulePaginationDto } from '@common/pagination/dto/shedule/schedulePagination.dto';

@Controller('schedules')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  // GET - Get list of schedules for admin (with pagination)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get('admin')
  @ApiOperation({ summary: 'Get all schedules for admin' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  async findAll(@Query() query: SchedulePaginationDto) {
    const { page = 1, take = 10, ...restFilters } = query;
    return await this.scheduleService.findAllSchedule({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
  }

  // GET - Get schedule by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get schedule by ID' })
  async findOut(@Param('id') id: number) {
    return await this.scheduleService.findScheduleById(id);
  }

  // POST - Create new schedule
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Post()
  @ApiOperation({ summary: 'Create a new schedule (admin, employee only)' })
  async create(@Body() createScheduleDto: CreateScheduleDto) {
    return await this.scheduleService.create(createScheduleDto);
  }

  // PUT - Update schedule by ID
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Put(':id')
  @ApiOperation({ summary: 'Update schedule by ID (admin, employee only)' })
  async update(
    @Param('id') id: number,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ) {
    return await this.scheduleService.update(id, updateScheduleDto);
  }

  // PATCH - Soft delete schedule
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id/soft-delete')
  @ApiOperation({ summary: 'Soft delete a schedule (admin, employee only)' })
  async softDeleteSchedule(@Param('id', ParseIntPipe) id: number) {
    return await this.scheduleService.softDeleteSchedule(id);
  }

  // PATCH - Restore soft-deleted schedule
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore a soft-deleted schedule (admin, employee only)',
  })
  async restoreSchedule(@Param('id', ParseIntPipe) id: number) {
    return await this.scheduleService.restoreSchedule(id);
  }

  // DELETE - Permanently delete schedule by ID
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Delete(':id/soft-delete')
  @ApiOperation({ summary: 'Delete schedule by ID (admin, employee only)' })
  async softDelete(@Param('id') id: number) {
    return await this.scheduleService.softDeleteSchedule(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Permanently delete an actor (admin, employee only)',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.scheduleService.removeSchedule(id);
  }
}
