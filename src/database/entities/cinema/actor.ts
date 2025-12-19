import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Movie } from './movie';
import { Gender } from '@common/enums/gender.enum';

@Entity('actor')
export class Actor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: false, length: 100})
  name: string;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  stage_name?: string;

  @Column({
    type: 'enum',
    enum: Gender,
    default: Gender.MALE,
  })
  gender: Gender;

  @Column({ type: 'date', nullable: false })
  date_of_birth: Date;

  @Column({ type: 'varchar', nullable: false, length: 100 })
  nationality: string;

  @Column({ type: 'varchar', nullable: false, length: 100 })
  biography: string;

  @Column({ type: 'text', nullable: false })
  profile_image: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @ManyToMany(() => Movie, (movie) => movie.actors)
  @JoinTable()
  movies: Movie[];
}
