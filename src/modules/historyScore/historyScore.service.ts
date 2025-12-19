import { applySorting } from '@common/pagination/apply_sort';
import { applyCommonFilters } from '@common/pagination/applyCommonFilters';
import { applyPagination } from '@common/pagination/applyPagination';
import { HistoryScorePaginationDto } from '@common/pagination/dto/historyScore/historyScorePagination.dto';
import { historyScoreFieldMapping } from '@common/pagination/fillters/historyScore-filed-mapping';
import { buildPaginationResponse } from '@common/pagination/pagination-response';
import { ResponseDetail } from '@common/response/response-detail-create-update';
import { ResponseList } from '@common/response/response-list';
import { HistoryScore } from '@database/entities/order/history_score';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';

@Injectable()
export class HistoryScoreService {
  constructor(
    @InjectRepository(HistoryScore)
    private readonly historyScoreRepository: Repository<HistoryScore>,
  ) {}
  async getAllHistoryScore(filters: HistoryScorePaginationDto) :Promise<ReturnType<typeof buildPaginationResponse>> {
    const qb = this.historyScoreRepository
      .createQueryBuilder('history_score')
      .leftJoinAndSelect('history_score.user', 'user')
      .leftJoinAndSelect('history_score.order', 'order')
      .leftJoinAndSelect('order.promotion', 'promotion');

    applyCommonFilters(qb, filters, historyScoreFieldMapping);

    const allowedFields = [
      'history_score.score_change',
      'history_score.created_at',
      'history_score.order.promotion.id',
      'history_score.order.id',
    ];
    applySorting<HistoryScore>(
      qb,
      filters.sortBy,
      filters.sortOrder,
      allowedFields,
      'history_score.created_at',
    );

    applyPagination(qb, {
      take: filters.take,
      page: filters.page,
    });
    const [historyScores, total] = await qb.getManyAndCount();

    return buildPaginationResponse(historyScores, {
      total,
      page: filters.page,
      take: filters.take,
    });
  }

  async getHistoryScoreByUserId(
    filters: HistoryScorePaginationDto & { userId: string },
  ): Promise<ResponseList<HistoryScore>> {
    const qb = this.historyScoreRepository
      .createQueryBuilder('history_score')
      .leftJoinAndSelect('history_score.user', 'user')
      .leftJoinAndSelect('history_score.order', 'order')
      .leftJoinAndSelect('order.promotion', 'promotion')
      .where('user.id = :userId', { userId: filters.userId });

    applyCommonFilters(qb, filters, historyScoreFieldMapping);

    const allowedFields = [
      'history_score.score_change',
      'history_score.created_at',
      'promotion.id',
      'order.id',
    ];
    applySorting<HistoryScore>(
      qb,
      filters.sortBy,
      filters.sortOrder,
      allowedFields,
      'history_score.created_at',
    );

    applyPagination(qb, {
      take: filters.take,
      page: filters.page,
    });
    const [historyScores, total] = await qb.getManyAndCount();

    return ResponseList.ok(buildPaginationResponse(historyScores, {
      total,
      page: filters.page,
      take: filters.take,
    }));
  }

  async getHistoryScoreById(id: number): Promise<ResponseDetail<HistoryScore>> {
    const historyScore = await this.historyScoreRepository.findOne({
      where: { id },
      relations: ['user', 'order', 'order.promotion'],
    });
    if (!historyScore) {
      throw new Error(`History score with ID ${id} not found`);
    }
    return ResponseDetail.ok(historyScore);
  }
}
