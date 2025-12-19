import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ActorService } from './actor.service';
import { CreateActorDto } from './dtos/createActor.dto';
import { UpdateActorDto } from './dtos/updateActor.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { ActorPaginationDto } from '@common/pagination/dto/actor/actor-pagination.dto';
import { Roles } from '@common/decorator/roles.decorator';
import { Role } from '@common/enums/roles.enum';
import { JwtAuthGuard } from '@common/guards/jwt.guard';
import { RolesGuard } from '@common/guards/roles.guard';



@Controller('actor')
export class ActorController {
  constructor(private readonly actorService: ActorService) { }



  // GET - get list of actors 
  @Get()
  @ApiOperation({ summary: 'Get all actors ' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  async getAllActors(@Query() query: ActorPaginationDto) {
    const { page = 1, take = 10, ...restFilters } = query;
    return await this.actorService.getAllActors({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
  }

  // GET - get actor by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get actor by ID' })
  async findActorById(@Param('id', ParseIntPipe) id: number) {
    return await this.actorService.findActorById(id);
  }

  // POST - Create new actor
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Post()
  @ApiOperation({ summary: 'Create a new actor (admin, employee only)' })
  @ApiBearerAuth()
  async createActor(@Body() createActorDto: CreateActorDto) {
    return await this.actorService.createActor(createActorDto);
  }

  // PUT - Update actor by ID
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update actor details (admin, employee only)' })
  async updateActor(
    @Param('id') id: string,
    @Body() updateActorDto: UpdateActorDto,
  ) {
    return await this.actorService.updateActor(+id, updateActorDto);
  }

  // PATCH - Soft delete actor
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id/soft-delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete an actor (admin, employee only)' })
  async softDeleteActor(@Param('id', ParseIntPipe) id: number) {
    return await this.actorService.softDeleteActor(id);
  }

  // DELETE - Restore soft-deleted actor
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id/restore')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Restore a soft-deleted actor (admin, employee only)',
  })
  async restoreActor(@Param('id', ParseIntPipe) id: number) {
    return await this.actorService.restoreActor(id);
  }

  // DELETE - Permanently delete actor
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Permanently delete an actor (admin, employee only)' })
  async removeActor(@Param('id') id: string) {
    return await this.actorService.removeActor(+id);
  }

}
