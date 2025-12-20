import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { Roles } from '@common/decorator/roles.decorator';
import { Role } from '@common/enums/roles.enum';
import { JwtAuthGuard } from '@common/guards/jwt.guard';
import { RolesGuard } from '@common/guards/roles.guard';

import { CreateGenreDto  } from './dtos/createGerne';
import { UpdateGenreDto  } from './dtos/updateGerne';
import { GenreService } from './gerne.service';
import { GenrePaginationDto } from '@common/pagination/dto/gerne/gerne.dto';



@Controller('genres')
export class GenreController {
  constructor(private readonly genreService: GenreService) { }



  // GET - Get list of genres for admin (with pagination)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get()
  @ApiOperation({ summary: 'Get all genres (admin, employee only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  @ApiBearerAuth()
  async getAll(@Query() query: GenrePaginationDto) {
    const { page = 1, take = 10, ...restFilters } = query;

    return await this.genreService.findAllGenres({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
  }

  // GET - Get genre by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get genre by ID' })
  async getById(@Param('id', ParseIntPipe) id: number) {
    return await this.genreService.findGenreById(id);
  }

  // POST - Create a new genre
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Post()
  @ApiOperation({ summary: 'Create a new genre (admin, employee only)' })
  @ApiBearerAuth()
  create(@Body() createGenreDto: CreateGenreDto) {
    return this.genreService.createGenre(createGenreDto);
  }

  // PUT - Update genre by ID
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Put(':id')
  @ApiOperation({ summary: 'Update genre by ID (admin, employee only)' })
  @ApiBearerAuth()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGenreDto: UpdateGenreDto,
  ) {
    return this.genreService.updateGenre(id, updateGenreDto);
  }

  // PATCH - Soft delete genre
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id/soft-delete')
  @ApiOperation({ summary: 'Soft delete a genre (admin, employee only)' })
  @ApiBearerAuth()
  softDelete(@Param('id', ParseIntPipe) id: number) {
    return this.genreService.softDeleteGenre(id);
  }

  // DELETE - Restore soft-deleted genre
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore a soft-deleted genre (admin, employee only)',
  })
  async restore(@Param('id', ParseIntPipe) id: number) {
    return await this.genreService.restoreGenre(id);
  }

  // DELETE - Delete genre by ID
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete genre by ID (admin only)' })
  @ApiBearerAuth()
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.genreService.deleteGenre(id);
  }
}
