import {
  Body,
  Controller,
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
  @ApiOperation({ summary: 'Avaliações de um worker' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getWorkerRatings(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.getRatings.execute(id, Number(page), Number(limit));
  }

  @Get(':id/rating-summary')
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
    return this.createRating.execute(workerId, req.user.userId, body.score, body.comment);
  }
}
