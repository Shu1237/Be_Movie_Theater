import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Put,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { VersionService } from './version.service';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateVersionDto } from './dto/update-version.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Roles } from '@common/decorator/roles.decorator';
import { Role } from '@common/enums/roles.enum';
import { JwtAuthGuard } from '@common/guards/jwt.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { VersionPaginationDto } from '@common/pagination/dto/version/versionPagination.dto';




@ApiBearerAuth()
@Controller('versions')
export class VersionController {
  constructor(private readonly versionService: VersionService) { }



 
  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, example: '2D' })
  @ApiOperation({ summary: 'Get all versions for admin' })
  async getAll(@Query() query: VersionPaginationDto) {
    const { page = 1, take = 10, ...filters } = query;

    return this.versionService.findAllVersions({
      page,
      take: Math.min(take, 100),
      ...filters,
    });
  }

  // GET - Get version by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get version by ID' })
  async getById(@Param('id', ParseIntPipe) id: number) {
    return await this.versionService.findVersionById(id);
  }

  // POST - Create new version
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Post()
  @ApiOperation({ summary: 'Create a new version (admin, employee only)' })
  async create(@Body() createVersionDto: CreateVersionDto) {
    return await this.versionService.createVersion(createVersionDto);
  }

  // PUT - Update version by ID
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)

  @Put(':id')
  @ApiOperation({ summary: 'Update a version by ID (admin, employee only)' })
  async update(
    @Param('id') id: number,
    @Body() updateVersionDto: UpdateVersionDto) {
    return await this.versionService.updateVersion(id, updateVersionDto);
  }

  // PATCH - Soft delete version
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id/soft-delete')
  @ApiOperation({ summary: 'Soft delete a version (admin, employee only)' })
  async softDelete(@Param('id', ParseIntPipe) id: number) {
    return await this.versionService.softDeleteVersion(id);
  }

  // PATCH - Restore soft-deleted version
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore a soft-deleted version (admin, employee only)',
  })
  async restore(@Param('id', ParseIntPipe) id: number) {
    return await this.versionService.restoreVersion(id);
  }

  // DELETE - Delete version permanently
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a version by ID (admin)' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.versionService.removeVersion(id);
  }
}
