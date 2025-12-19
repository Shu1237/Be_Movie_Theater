;
import { FilterField } from '@common/utils/type';
import { SelectQueryBuilder } from 'typeorm';

export const actorFieldMapping: Record<string, FilterField> = {
  is_deleted: {
    field: 'actor.is_deleted',
    operator: '=',
  },
  search: {
    customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
      qb.andWhere(
        `(
          actor.name LIKE :search OR
          actor.stage_name LIKE :search OR
          actor.nationality LIKE :search
        )`,
        { search: `%${value}%` },
      );
    },
  },
  gender: {
    operator: '=',
    field: 'actor.gender',
  },
  date_of_birth: {
    operator: '=',
    field: 'actor.date_of_birth',
  },
};
