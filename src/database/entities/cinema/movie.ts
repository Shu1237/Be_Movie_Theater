import {
  Entity,
  Column,
  OneToMany,
  PrimaryGeneratedColumn,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Schedule } from './schedule';
import { Actor } from './actor';

import { Version } from './version';
import { Genre } from './genre';

@Entity('movie')
export class Movie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 100 })
  director: string;

  @Column({ type: 'int' })
  duration: number;

  @Column({ type: 'date' })
  from_date: Date;

  @Column({ type: 'date' })
  to_date: Date;

  @Column({ type: 'varchar', length: 100 })
  production_company: string;

  @Column({ type: 'varchar', length: 255 })
  thumbnail: string;

  @Column({ type: 'varchar', length: 255 })
  banner: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  limited_age: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  trailer: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nation: string;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Schedule, (schedule) => schedule.movie)
  schedules: Schedule[];

  @ManyToMany(() => Actor, (actor) => actor.movies)
  actors: Actor[];

  @ManyToMany(() => Genre, (genre) => genre.movies)
  genres: Genre[];

  @ManyToMany(() => Version, (version) => version.movies)
  versions: Version[];
}
