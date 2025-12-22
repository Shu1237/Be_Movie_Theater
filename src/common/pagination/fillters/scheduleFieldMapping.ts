
import { FilterField } from '@common/utils/type';
import { SelectQueryBuilder } from 'typeorm';

export const scheduleFieldMapping: Record<string, FilterField> = {
 search:{
    customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
      qb.andWhere(
        '(movie.name LIKE :search)',
        { search: `%${value}%` },
      );
    }
 },
  version_id: {
    field: 'version.id',
    operator: '=',
  },
  scheduleStartTime: {
    customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
      qb.andWhere('schedule.start_movie_time >= :startTime', {
        startTime: value,
      });
    },
  },
  scheduleEndTime: {
    customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
      qb.andWhere('schedule.start_movie_time <= :endTime', {
        endTime: value,
      });
    },
  },
  is_deleted: {
    field: 'schedule.is_deleted',
    operator: '=',
  },
};
