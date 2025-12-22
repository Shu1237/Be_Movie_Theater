import { Controller, Get, Param, UseGuards, Request, Query } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Roles } from '@common/decorator/roles.decorator';
import { Role } from '@common/enums/roles.enum';
import { JwtAuthGuard } from '@common/guards/jwt.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { TicketPaginationDto } from '@common/pagination/dto/ticket/ticket-pagination.dto';
import { JWTUserType } from '@common/utils/type';



@UseGuards(JwtAuthGuard)
@Controller('ticket')
export class TicketController {
  constructor(private readonly ticketService: TicketService) { }


 

 
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get('admin')
  @ApiOperation({ summary: 'Get all tickets ' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  async getAllTickets(@Query() query: TicketPaginationDto) {
    const { page = 1, take = 10, ...restFilters } = query;
    return this.ticketService.getAllTickets({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
  }

  // GET - Get tickets by user ID
  @Get('tickets-by-user-id')
  @ApiOperation({
    summary: 'Get tickets by user ID',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
 
  @ApiBearerAuth()
  async getTicketsByUserId(@Request() req :{user:JWTUserType}, @Query() query: TicketPaginationDto) {
    const user = req.user as JWTUserType;
    const { page = 1, take = 10, ...restFilters } = query;

    return this.ticketService.getTicketsByUserId({
      page,
      take: Math.min(take, 100),
      ...restFilters,
      userId: user.account_id,
    });
  }

  // GET - Get ticket by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiBearerAuth()
  getTicketById(@Param('id') id: number) {
    return this.ticketService.getTicketById(id);
  }
}
