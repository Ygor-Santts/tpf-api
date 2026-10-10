import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ActivateWorkerDTO,
  DeleteAccountDTO,
  ForgotPasswordDTO,
  RegisterWorkerDTO,
  ResetPasswordDTO,
  VerifyEmailDTO,
} from './dtos';
import { IRegisterWorker } from '../use-cases/services/register-worker';
import { ILogin, ILoginResponseDTO } from '../use-cases/services/login';
import { LoginDTO } from './dtos/login.dto';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiOperation } from '@nestjs/swagger';
import { IGenericExceptionResponseDTO } from '@tpf/common';
import { IRegisterClient, RegisterClientDTO } from '../use-cases/services/register-client';
import { IGetMe } from '../use-cases/services/get-me';
import { IActivateWorker } from '../use-cases/services/activate-worker';
import { IDeleteAccount } from '../use-cases/services/delete-account';
import { JwtAuthGuard } from '../guards/jwt.guard';
import {
  IForgotPassword,
  IResetPassword,
} from '../use-cases/services/password-reset';
import {
  IResendEmailVerification,
  IVerifyEmail,
} from '../use-cases/services/email-verification';

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
    private readonly activateWorkerUseCase: IActivateWorker,
    private readonly deleteAccountUseCase: IDeleteAccount,
    private readonly verifyEmailUseCase: IVerifyEmail,
    private readonly resendEmailVerificationUseCase: IResendEmailVerification,
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

  @Post('worker/activate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ativa o perfil de trabalhador do usuário logado' })
  @ApiResponse({ status: 201, type: ILoginResponseDTO })
  @ApiResponse({ status: 404, type: IGenericExceptionResponseDTO })
  @ApiResponse({ status: 409, type: IGenericExceptionResponseDTO })
  activateWorker(@Request() req: any, @Body() body: ActivateWorkerDTO) {
    return this.activateWorkerUseCase.execute(req.user.userId, body);
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
    description: 'Sempre 204, exista ou não o e-mail',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  forgotPassword(@Body() body: ForgotPasswordDTO) {
    return this.forgotPasswordUseCase.execute(body);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Redefine a senha a partir do link' })
  @ApiResponse({ status: 204, description: 'Senha redefinida' })
  @ApiResponse({ status: 400, type: IGenericExceptionResponseDTO })
  @HttpCode(HttpStatus.NO_CONTENT)
  resetPassword(@Body() body: ResetPasswordDTO) {
    return this.resetPasswordUseCase.execute(body);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Confirma o e-mail a partir do link' })
  @ApiResponse({ status: 204, description: 'E-mail confirmado' })
  @ApiResponse({ status: 400, type: IGenericExceptionResponseDTO })
  @HttpCode(HttpStatus.NO_CONTENT)
  verifyEmail(@Body() body: VerifyEmailDTO) {
    return this.verifyEmailUseCase.execute(body);
  }

  @Post('verify-email/resend')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reenvia o link de confirmação de e-mail' })
  @ApiResponse({ status: 204, description: 'Link enviado' })
  @ApiResponse({ status: 400, type: IGenericExceptionResponseDTO })
  @HttpCode(HttpStatus.NO_CONTENT)
  resendEmailVerification(@Request() req: any) {
    return this.resendEmailVerificationUseCase.execute(req.user.userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perfil do usuário autenticado' })
  getMe(@Request() req: any) {
    return this.getMeUseCase.execute(req.user.userId);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Exclui a conta do usuário autenticado' })
  @ApiResponse({ status: 204, description: 'Conta excluída' })
  @ApiResponse({ status: 403, type: IGenericExceptionResponseDTO })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMe(@Request() req: any, @Body() body: DeleteAccountDTO) {
    return this.deleteAccountUseCase.execute(req.user.userId, body);
  }
}
