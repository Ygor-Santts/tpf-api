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
import { RegisterWorkerDTO } from './dtos';
import { IRegisterWorker } from '../use-cases/services/register-worker';
import { ILogin, ILoginResponseDTO } from '../use-cases/services/login';
import { LoginDTO } from './dtos/login.dto';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiOperation } from '@nestjs/swagger';
import { IGenericExceptionResponseDTO } from '@tpf/common';
import { IRegisterClient, RegisterClientDTO } from '../use-cases/services/register-client';
import { IGetMe } from '../use-cases/services/get-me';
import { JwtAuthGuard } from '../guards/jwt.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerWorkerUseCase: IRegisterWorker,
    private readonly loginUseCase: ILogin,
    private readonly registerClientUseCase: IRegisterClient,
    private readonly getMeUseCase: IGetMe,
  ) {}

  @Post('sign-in')
  @ApiOperation({ summary: 'Login de usuário' })
  @ApiResponse({ status: 200, type: ILoginResponseDTO })
  @ApiResponse({ status: 404, type: IGenericExceptionResponseDTO })
  @HttpCode(HttpStatus.OK)
  signIn(@Body() body: LoginDTO) {
    return this.loginUseCase.execute(body);
  }

  @Post('worker/sign-up')
  @ApiOperation({ summary: 'Cadastro de trabalhador' })
  @ApiResponse({ status: 201, description: 'Worker registered successfully' })
  @ApiResponse({ status: 409, type: IGenericExceptionResponseDTO })
  workerSignUp(@Body() body: RegisterWorkerDTO) {
    return this.registerWorkerUseCase.execute(body);
  }

  @Post('client/sign-up')
  @ApiOperation({ summary: 'Cadastro de cliente' })
  @ApiResponse({ status: 201, description: 'Client registered successfully' })
  @ApiResponse({ status: 409, type: IGenericExceptionResponseDTO })
  clientSignUp(@Body() body: RegisterClientDTO) {
    return this.registerClientUseCase.execute(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perfil do usuário autenticado' })
  getMe(@Request() req: any) {
    return this.getMeUseCase.execute(req.user.userId);
  }
}
