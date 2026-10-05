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
import { ForgotPasswordDTO, RegisterWorkerDTO, ResetPasswordDTO } from './dtos';
import { IRegisterWorker } from '../use-cases/services/register-worker';
import { ILogin, ILoginResponseDTO } from '../use-cases/services/login';
import { LoginDTO } from './dtos/login.dto';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiOperation } from '@nestjs/swagger';
import { IGenericExceptionResponseDTO } from '@tpf/common';
import { IRegisterClient, RegisterClientDTO } from '../use-cases/services/register-client';
import { IGetMe } from '../use-cases/services/get-me';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { IForgotPassword } from '../use-cases/services/forgot-password';
import { IResetPassword } from '../use-cases/services/reset-password';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerWorkerUseCase: IRegisterWorker,
    private readonly loginUseCase: ILogin,
    private readonly registerClientUseCase: IRegisterClient,
    private readonly getMeUseCase: IGetMe,
    private readonly forgotPasswordUseCase: IForgotPassword,
    private readonly resetPasswordUseCase: IResetPassword,
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

  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicita link de redefinição de senha' })
  @ApiResponse({
    status: 204,
    description: 'Sempre retorna 204, exista ou não o e-mail',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  forgotPassword(@Body() body: ForgotPasswordDTO) {
    return this.forgotPasswordUseCase.execute(body);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Redefine a senha a partir do token' })
  @ApiResponse({ status: 204, description: 'Senha redefinida' })
  @ApiResponse({ status: 400, type: IGenericExceptionResponseDTO })
  @HttpCode(HttpStatus.NO_CONTENT)
  resetPassword(@Body() body: ResetPasswordDTO) {
    return this.resetPasswordUseCase.execute(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perfil do usuário autenticado' })
  getMe(@Request() req: any) {
    return this.getMeUseCase.execute(req.user.userId);
  }
}
