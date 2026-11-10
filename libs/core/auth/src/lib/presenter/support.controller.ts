import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { clientIp, IGenericExceptionResponseDTO } from '@tpf/common';
import { SupportMessageDTO } from './dtos';
import { ISendSupportMessage } from '../use-cases/services/send-support-message';
import { OptionalJwtAuthGuard } from '../guards/optional-jwt.guard';
import { SessionUser } from '../guards/jwt.guard';

@ApiTags('Support')
@Controller('support')
export class SupportController {
  constructor(private readonly sendSupportMessage: ISendSupportMessage) {}

  @Get()
  @ApiOperation({ summary: 'Diz se o formulário de suporte pode enviar' })
  @ApiResponse({ status: 200, description: '{ available: boolean }' })
  status() {
    return { available: this.sendSupportMessage.isAvailable() };
  }

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Envia uma mensagem para o suporte por e-mail' })
  @ApiResponse({ status: 204, description: 'Mensagem enviada' })
  @ApiResponse({ status: 429, type: IGenericExceptionResponseDTO })
  @ApiResponse({ status: 503, type: IGenericExceptionResponseDTO })
  @HttpCode(HttpStatus.NO_CONTENT)
  send(@Request() req: any, @Body() body: SupportMessageDTO) {
    const user = req.user as SessionUser | undefined;
    return this.sendSupportMessage.execute(
      body,
      clientIp(req),
      user ? { userId: user.userId, isWorker: user.isWorker } : undefined,
    );
  }
}
