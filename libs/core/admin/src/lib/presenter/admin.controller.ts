import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminGuard } from '@tpf/auth';
import {
  AdminCategoryDTO,
  AdminTaxonomyService,
} from '../services/admin-taxonomy.service';
import {
  AdminUserDetailDTO,
  AdminUserPageDTO,
  AdminUsersService,
} from '../services/admin-users.service';
import {
  AdminNameDTO,
  ListUsersDTO,
  MergeDTO,
  SetEnabledDTO,
  UpdateCategoryDTO,
  UpdateOccupationDTO,
} from './dtos';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly taxonomy: AdminTaxonomyService,
    private readonly users: AdminUsersService,
  ) {}

  @Get('categories')
  @ApiOperation({ summary: 'Categorias e profissões, inclusive as em análise' })
  @ApiResponse({ status: 200, type: AdminCategoryDTO, isArray: true })
  listCategories() {
    return this.taxonomy.list();
  }

  @Post('categories')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Criar categoria (já aprovada)' })
  createCategory(@Body() body: AdminNameDTO) {
    return this.taxonomy.createCategory(body.name);
  }

  @Patch('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Renomear ou aprovar categoria' })
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCategoryDTO,
  ) {
    return this.taxonomy.updateCategory(id, body);
  }

  @Post('categories/:id/merge')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Juntar categoria em outra (move as profissões)' })
  mergeCategory(@Param('id', ParseIntPipe) id: number, @Body() body: MergeDTO) {
    return this.taxonomy.mergeCategory(id, body.intoId);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Apagar categoria sem trabalhadores' })
  deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.taxonomy.deleteCategory(id);
  }

  @Post('categories/:id/occupations')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Criar profissão na categoria (já aprovada)' })
  createOccupation(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AdminNameDTO,
  ) {
    return this.taxonomy.createOccupation(id, body.name);
  }

  @Patch('occupations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Renomear, aprovar ou mudar profissão de categoria',
  })
  updateOccupation(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateOccupationDTO,
  ) {
    return this.taxonomy.updateOccupation(id, body);
  }

  @Post('occupations/:id/merge')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Juntar profissão em outra (move os trabalhadores)',
  })
  mergeOccupation(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: MergeDTO,
  ) {
    return this.taxonomy.mergeOccupation(id, body.intoId);
  }

  @Delete('occupations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Apagar profissão sem trabalhadores' })
  deleteOccupation(@Param('id', ParseIntPipe) id: number) {
    return this.taxonomy.deleteOccupation(id);
  }

  @Get('users')
  @ApiOperation({ summary: 'Buscar contas' })
  @ApiResponse({ status: 200, type: AdminUserPageDTO })
  listUsers(@Query() query: ListUsersDTO) {
    return this.users.list(query.search, query.filter, query.page);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Detalhes de uma conta' })
  @ApiResponse({ status: 200, type: AdminUserDetailDTO })
  getUser(@Param('id', ParseIntPipe) id: number) {
    return this.users.get(id);
  }

  @Patch('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desativar ou reativar conta' })
  setEnabled(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: SetEnabledDTO,
  ) {
    return this.users.setEnabled(req.user.userId, id, body.enabled);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir conta de vez' })
  deleteUser(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.users.remove(req.user.userId, id);
  }
}
