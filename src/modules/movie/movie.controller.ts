import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  ParseIntPipe,
  UseGuards,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dtos/createMovie.dto';
import { Roles } from '@common/decorator/roles.decorator';
import { Role } from '@common/enums/roles.enum';
import { JwtAuthGuard } from '@common/guards/jwt.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { MoviePaginationDto } from '@common/pagination/dto/movie/moviePagination.dto';
import { UpdateMovieDto } from './dtos/updateMovie.dto';

@ApiBearerAuth()
@Controller('movies')
export class MovieController {
  constructor(private readonly movieService: MovieService) { }


  // GET - get all movies for admin (with pagination)
  @Get('admin')
  @ApiOperation({ summary: 'Get all movies for admin' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  getAllMovies(@Query() query: MoviePaginationDto) {
    const { page = 1, take = 10, ...restFilters } = query;
    return this.movieService.getAllMovies({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
  }

  // GET - get movie by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get movie by ID' })
  getMovieById(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.getMovieById(id);
  }

  // GET - get all genres of a movie

  @Get(':movieId/gernes')
  @ApiOperation({ summary: 'Get all genres of a movie' })
  getGernesOfMovie(
    @Param('movieId', ParseIntPipe) movieId: number,
  ) {
    return this.movieService.getGernesOfMovie(movieId);
  }

  // POST - Create new movie
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Post()
  @ApiOperation({ summary: 'Create a new movie' })
  async createMovie(@Body() movieDto: CreateMovieDto) {
    return this.movieService.createMovie(movieDto);
  }

  // PUT - Update movie by ID
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Put(':id')
  @ApiOperation({ summary: 'Update movie by ID (admin, employee only)' })
  async updateMovie(
    @Param('id', ParseIntPipe) id: number,
    @Body() movieDTO: UpdateMovieDto,
  ){
    return this.movieService.updateMovie(id, movieDTO);
  }

  // PATCH - Soft delete movie by ID
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id')
  @ApiOperation({ summary: 'Soft delete a movie by ID (admin, employee only)' })
  async softDeleteMovie(@Param('id', ParseIntPipe) id: number) {
    await this.movieService.softDeleteMovie(id);
    return { message: 'Movie soft deleted successfully' };
  }

  // PATCH - Restore soft-deleted movie by ID
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore a soft-deleted movie by ID (admin, employee only)',
  })
  async restoreMovie(@Param('id', ParseIntPipe) id: number) {
    return await this.movieService.restoreMovie(id);
  }

  // DELETE - Hard delete movie by ID
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Delete(':id')
  @ApiOperation({ summary: 'Hard delete a movie by ID (admin, employee only)' })
  async deleteMovie(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.deleteMovie(id);
  }
}
