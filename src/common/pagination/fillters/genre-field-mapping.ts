import { FilterField } from "@common/utils/type";


export const genreFieldMapping: Record<string, FilterField> = {

  is_deleted: {
    field: 'genre.is_deleted',
    operator: '=',
  },
  search: {
    customWhere: (qb, value) => {
      qb.andWhere('genre.genre_name LIKE :search', {
        search: `%${value}%`,
      });
    },
  },
};
