import { Controller, Get,  UseGuards, Query } from '@nestjs/common';
import { OverviewService } from './overview.service';
import { ApiBearerAuth } from '@nestjs/swagger/dist/decorators/api-bearer.decorator';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Roles } from '@common/decorator/roles.decorator';
import { Role } from '@common/enums/roles.enum';
import { JwtAuthGuard } from '@common/guards/jwt.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { DailyReportDto } from '@common/pagination/dto/dailyReport/dailyReport.dto';


@Controller('overview')
@ApiBearerAuth()
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) { }


  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get('reports/daily-orders')
  @ApiOperation({ summary: 'Get all daily order reports for admin' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  getDailyOrderReports(@Query() query: DailyReportDto) {
    const { page = 1, take = 10, ...restFilters } = query;
    return this.overviewService.getDailyOrderReports({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
  }
  
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get()
  getOverview() {
    return this.overviewService.getOverview();
  }

  @Get('top-movies')
  getTopMovies() {
    return this.overviewService.getTopMoviesByRevenue();
  }

  @Get('now-showing')
  getNowShowing() {
    return this.overviewService.getNowShowing();
  }
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get('average-order-value')
  getAverageOrderValue() {

    return this.overviewService.getAverageOrderValue();
  }

  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get('customer-retention')
  getCustomerRetentionRate() {
    return this.overviewService.getCustomerRetentionRate();
  }
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get('peak-hours-analysis')
  getPeakHoursAnalysis() {
    return this.overviewService.getPeakHoursAnalysis();
  }
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get('movie-performance')
  getMoviePerformanceAnalysis() {
    return this.overviewService.getMoviePerformanceAnalysis();
  }
}
