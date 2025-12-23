
import { FilterField } from '@common/utils/type';
import { SelectQueryBuilder } from 'typeorm';

export const movieFieldMapping: Record<string, FilterField> = {
 
  fromDate: {
    customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
      qb.andWhere('movie.from_date >= :start', {
        start: `${value} 00:00:00`,
      });
    },
  },
  toDate: {
    customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
      qb.andWhere('movie.from_date <= :end', {
        end: `${value} 23:59:59`,
      });
    },
  },
  is_deleted: {
    field: 'movie.is_deleted',
    operator: '=',
  },
  actor_id: {
    field: 'actor.id',
    operator: '=',
  },
  genre_id: {
    field: 'genre.id',
    operator: '=',
  },
  version_id: {
    field: 'version.id',
    operator: '=',
  },
  search: {
    customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
      qb.andWhere(
        `(movie.name LIKE :search)`,
        { search: `%${value}%` },
      );
    },
  },
};
