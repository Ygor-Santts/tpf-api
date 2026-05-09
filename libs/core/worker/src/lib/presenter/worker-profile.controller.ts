import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@tpf/auth';
import { IGetWorkerMe } from '../use-cases/get-worker-me';
import { IUpdateWorkerProfile } from '../use-cases/update-worker-profile';
import { IUploadPortfolioItem } from '../use-cases/upload-portfolio-item';
import { IDeletePortfolioItem } from '../use-cases/delete-portfolio-item';
import { IGetPortfolio } from '../use-cases/get-portfolio';
import { UpdateWorkerProfileDTO } from './dtos/update-worker-profile.dto';

@ApiTags('Worker Profile')
@Controller('worker')
export class WorkerProfileController {
  constructor(
    private readonly getWorkerMe: IGetWorkerMe,
    private readonly updateProfile: IUpdateWorkerProfile,
    private readonly uploadItem: IUploadPortfolioItem,
    private readonly deleteItem: IDeletePortfolioItem,
    private readonly getPortfolio: IGetPortfolio,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perfil do worker autenticado' })
  getMe(@Request() req: any) {
    return this.getWorkerMe.execute(req.user.workerId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Editar perfil do worker' })
  updateWorkerProfile(@Request() req: any, @Body() body: UpdateWorkerProfileDTO) {
    return this.updateProfile.execute({ workerId: req.user.workerId, ...body });
  }

  @Get(':id/profile')
  @ApiOperation({ summary: 'Perfil público de um worker' })
  getWorkerPublicProfile(@Param('id', ParseIntPipe) id: number) {
    return this.getWorkerMe.execute(id);
  }

  @Get(':id/portfolio')
  @ApiOperation({ summary: 'Portfólio público de um worker' })
  getWorkerPortfolio(@Param('id', ParseIntPipe) id: number) {
    return this.getPortfolio.execute(id);
  }

  @Post('portfolio')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload de item de portfólio' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req: any, _file, cb) => {
          const workerId = req.user?.workerId;
          const dir = join(process.cwd(), 'uploads', 'portfolio', String(workerId));
          mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadPortfolioItem(
    @Request() req: any,
    @UploadedFile() file: any,
    @Body('caption') caption?: string,
  ) {
    return this.uploadItem.execute(req.user.workerId, file, caption);
  }

  @Delete('portfolio/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover item do portfólio' })
  deletePortfolioItem(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.deleteItem.execute(req.user.workerId, id);
  }
}
