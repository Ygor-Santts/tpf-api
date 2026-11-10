import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@tpf/auth';
import { ICreateRating } from '../use-cases/create-rating';
import { IGetRatings } from '../use-cases/get-ratings';
import { IGetRatingSummary } from '../use-cases/get-rating-summary';
import { EnabledWorkerGuard } from './enabled-worker.guard';
import { CreateRatingDTO } from './dtos/create-rating.dto';

@ApiTags('Ratings')
@Controller('worker')
export class RatingController {
  constructor(
    private readonly createRating: ICreateRating,
    private readonly getRatings: IGetRatings,
    private readonly getRatingSummary: IGetRatingSummary,
  ) {}

  @Get(':id/ratings')
  @UseGuards(EnabledWorkerGuard)
  @ApiOperation({ summary: 'Avaliações de um worker' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getWorkerRatings(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.getRatings.execute(
      id,
      clamp(page, 1, Number.MAX_SAFE_INTEGER, 1),
      clamp(limit, 1, 50, 10),
    );
  }

  @Get(':id/rating-summary')
  @UseGuards(EnabledWorkerGuard)
  @ApiOperation({ summary: 'Resumo de avaliações de um worker' })
  getWorkerRatingSummary(@Param('id', ParseIntPipe) id: number) {
    return this.getRatingSummary.execute(id);
  }

  @Post(':id/ratings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Avaliar um worker' })
  submitRating(
    @Param('id', ParseIntPipe) workerId: number,
    @Request() req: any,
    @Body() body: CreateRatingDTO,
  ) {
    // A confirmed email makes fake accounts for fake reviews harder.
    if (!req.user.emailVerified)
      throw new ForbiddenException(
        'Confirme seu e-mail para avaliar. O link está no e-mail que enviamos no cadastro.',
      );
    return this.createRating.execute(workerId, req.user.userId, body.score, body.comment);
  }
}

// Whole number within [min, max]; anything else in the query gets the fallback.
function clamp(value: unknown, min: number, max: number, fallback: number) {
  const n = Number(value);
  if (!Number.isInteger(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}
