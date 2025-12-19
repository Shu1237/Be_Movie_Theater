
import { Role } from '@common/enums/roles.enum';
import { AudienceType } from '../enums/audience_type.enum';
import { SelectQueryBuilder } from 'typeorm';
import { Gender } from '@common/enums/gender.enum';






export type JWTUserType = {
  account_id: string;
  username: string;
  email:string;
  provider: 'local' | 'google';
  role_id: Role;
};

export type GoogleUserType = {
  email: string;
  avatar?: string | null;
  gender:Gender;
};
export type ProductOrderItem = {
  product_id: number;
  quantity: number;
};
export type SeatInfo = {
  id: string;
  audience_type: AudienceType;
};

export type OrderBillType = {
  payment_method_id: number;
  total_prices: string;
  promotion_id: number;
  schedule_id: number;
  customer_id?: string;
  seats: SeatInfo[];
  products?: ProductOrderItem[];
};

export type CreatePromotionType = {
  title: string;
  detail?: string;
  discount_level: string;
  start_time?: string;
  end_time?: string;
  exchange?: string;
  code: string;
  is_active?: boolean;
};

export type UpdatePromotionType = {
  title?: string;
  detail?: string;
  discount?: string;
  start_time?: string;
  end_time?: string;
  exchange?: string;
  code?: string;
  is_active?: boolean;
};

export type ChangePromotionType = {
  id: number;
  exchange: number;
};

export type IActor = {
  id: number;
  name: string;
};

export type IVersion = {
  id: number;
  name: string;
};

export type IGerne = {
  id: number;
  genre_name: string;
};


export type IMovie = {
  id: number;
  name: string;
  content: string;
  director: string;
  duration: number;
  from_date: Date;
  to_date: Date;
  limited_age: string;
  trailer: string;
  nation: string;
  production_company: string;
  thumbnail: string;
  banner: string;
  version?: string;
  is_deleted: boolean;
  actors: IActor[]; 
  gernes: IGerne[]; 
  versions: IVersion[]; 
};

export type ISchedule = {
  id: number;
  start_movie_time: Date;
  end_movie_time: Date;
  movie: IMovieBasic;
  cinemaRoom: {
    id: number;
    name: string; 
  };
  is_deleted: boolean;
  version?: { id: number; name: string } | null; 

};

export type IMovieBasic = {
  id: number;
  name: string;
};

export type TicketSummary = {
  id: string;
  schedule: {
    start_movie_time: Date;
    end_movie_time: Date;
    movie: {
      id: number;
      name: string;
      duration: number;
      thumbnail: string;
    };
    cinemaRoom: {
      id: number;
      name: string;
    };
  };
  seat: {
    id: string;
    row: string;
    column: string;
  };
};

export type HoldSeatType = {
  seatIds: string[];
  schedule_id: number;
};

export type LoginAzureType = {
  sub: string;
  email: string;
  picture?: string;
  name: string;
  role_id?: number;
};
export type ProductType = {
  id: number;
  name: string;
  price: string;
  category?: string;
  discount?: string;
  type: string;
};

export type ZaloReturnQuery = {
  appid: string;
  apptransid: string;
  pmcid: string;
  bankcode?: string;
  amount: string;
  discountamount: string;
  status: string;
  checksum: string;
};

// pagination
type Operator =
  | '='
  | 'LIKE'
  | 'ILIKE'
  | 'BETWEEN'
  | '<>'
  | '!='
  | '>'
  | '<'
  | '>='
  | '<='
  | 'IN'
  | 'NOT IN'
  | 'IS NULL'
  | 'IS NOT NULL';
export type PaginationParams = {
  page: number;
  take: number;
};

export interface FilterField {
  field?: string;
  operator?: Operator;
  paramName?: string;
  customWhere?: (qb: SelectQueryBuilder<any>, value: any) => void; // optional custom where function
}

export type MetaOptions = {
  total: number;
  page: number;
  take: number;
  totalSuccess?: number;
  totalFailed?: number;
  totalPending?: number;
  revenue?: string | number;
  [key: string]: any;
  // totalMovieAvailable?: number;
  // totalMovieDeleted?: number;
};
