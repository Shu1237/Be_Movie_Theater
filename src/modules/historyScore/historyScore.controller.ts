import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { HistoryScoreService } from './historyScore.service';
import { Roles } from '@common/decorator/roles.decorator';
import { Role } from '@common/enums/roles.enum';
import { JwtAuthGuard } from '@common/guards/jwt.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { HistoryScorePaginationDto } from '@common/pagination/dto/historyScore/historyScorePagination.dto';
import { JWTUserType } from '@common/utils/type';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';


@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('history-score')
export class HistoryScoreController {
  constructor(private readonly historyScoreService: HistoryScoreService) { }

  // GET - Get all history scores for admin with pagination
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get('admin')
  @ApiOperation({ summary: 'Get all history scores for admin' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  getHistoryScore(@Query() query: HistoryScorePaginationDto) {
    const { page = 1, take = 10, ...restFilters } = query;
    return this.historyScoreService.getAllHistoryScore({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
  }

  // GET - Get history scores by user ID
  @Get('user')
  @ApiOperation({ summary: 'Get history scores for user' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  getHistoryScoreByUserId(
    @Query() query: HistoryScorePaginationDto,
    @Request() req :{ user: JWTUserType },
  ) {
    const user = req.user as JWTUserType;
    const { page = 1, take = 10, ...restFilters } = query;

    return this.historyScoreService.getHistoryScoreByUserId({
      page,
      take: Math.min(take, 100),
      ...restFilters,
      userId: user.account_id,
    });
  }
  // GET - Get history score by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get history score by ID' })
  @ApiParam({ name: 'id', required: true, type: Number, example: 1 })
  getHistoryScoreById(@Param('id', ParseIntPipe) id: number) {
    return this.historyScoreService.getHistoryScoreById(id);
  }
}
