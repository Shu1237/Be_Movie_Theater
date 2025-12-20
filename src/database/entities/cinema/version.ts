import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Movie } from './movie';

@Entity('version')
export class Version {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  version_name: string;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean; 

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToMany(() => Movie, (movie) => movie.versions)
  @JoinTable()
  movies: Movie[];
}
