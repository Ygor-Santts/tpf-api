import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IGenericExceptionResponseDTO } from '@tpf/common';
import { SupportMessageDTO } from './dtos';
import { ISendSupportMessage } from '../use-cases/services/send-support-message';
import { OptionalJwtAuthGuard } from '../guards/optional-jwt.guard';
import { JwtPayload } from '../guards/jwt.guard';

@ApiTags('Support')
@Controller('support')
export class SupportController {
  constructor(private readonly sendSupportMessage: ISendSupportMessage) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Envia uma mensagem para o suporte por e-mail' })
  @ApiResponse({ status: 204, description: 'Mensagem enviada' })
  @ApiResponse({ status: 429, type: IGenericExceptionResponseDTO })
  @ApiResponse({ status: 503, type: IGenericExceptionResponseDTO })
  @HttpCode(HttpStatus.NO_CONTENT)
  send(@Request() req: any, @Body() body: SupportMessageDTO) {
    const user = req.user as JwtPayload | undefined;
    return this.sendSupportMessage.execute(
      body,
      clientIp(req),
      user ? { userId: user.userId, isWorker: user.isWorker } : undefined,
    );
  }
}

// Behind Caddy the socket address is Caddy's. Caddy replaces any
// X-Forwarded-For a client sends, so its last entry is the real address.
function clientIp(req: any): string {
  const forwarded = String(req.headers['x-forwarded-for'] ?? '');
  return forwarded.split(',').pop()?.trim() || req.ip || 'unknown';
}
