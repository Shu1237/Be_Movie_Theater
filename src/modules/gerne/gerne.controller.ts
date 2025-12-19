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
import { GerneService } from './gerne.service';
import { Roles } from '@common/decorator/roles.decorator';
import { Role } from '@common/enums/roles.enum';
import { JwtAuthGuard } from '@common/guards/jwt.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { GernePaginationDto } from '@common/pagination/dto/gerne/gerne.dto';
import { CreateGerneDto } from './dtos/createGerne';
import { UpdateGerneDto } from './dtos/updateGerne';



@Controller('gernes')
export class GerneController {
  constructor(private readonly gerneService: GerneService) { }



  // GET - Get list of genres for admin (with pagination)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get()
  @ApiOperation({ summary: 'Get all genres (admin, employee only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  @ApiBearerAuth()
  async findAllGernes(@Query() query: GernePaginationDto) {
    const { page = 1, take = 10, ...restFilters } = query;

    return await this.gerneService.findAllGernes({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
  }

  // GET - Get genre by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get genre by ID' })
  async findGerneById(@Param('id', ParseIntPipe) id: number) {
    return await this.gerneService.findGerneById(id);
  }

  // POST - Create a new genre
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Post()
  @ApiOperation({ summary: 'Create a new genre (admin, employee only)' })
  @ApiBearerAuth()
  createGerne(@Body() createGerneDto: CreateGerneDto) {
    return this.gerneService.createGerne(createGerneDto);
  }

  // PUT - Update genre by ID
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Put(':id')
  @ApiOperation({ summary: 'Update genre by ID (admin, employee only)' })
  @ApiBearerAuth()
  updateGerne(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGerneDto: UpdateGerneDto,
  ) {
    return this.gerneService.updateGerne(id, updateGerneDto);
  }

  // PATCH - Soft delete genre
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id/soft-delete')
  @ApiOperation({ summary: 'Soft delete a genre (admin, employee only)' })
  @ApiBearerAuth()
  softDeleteGerne(@Param('id', ParseIntPipe) id: number) {
    return this.gerneService.softDeleteGerne(id);
  }

  // DELETE - Restore soft-deleted genre
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore a soft-deleted genre (admin, employee only)',
  })
  async restoreGerne(@Param('id', ParseIntPipe) id: number) {
    return await this.gerneService.restoreGerne(id);
  }

  // DELETE - Delete genre by ID
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete genre by ID (admin only)' })
  @ApiBearerAuth()
  async deleteGerne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.gerneService.deleteGerne(id);
  }
}
