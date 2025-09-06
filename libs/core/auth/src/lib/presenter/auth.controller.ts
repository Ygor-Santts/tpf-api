import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { RegisterWorkerDTO } from './dtos';
import { IRegisterWorker } from '../use-cases/services/register-worker';
import { ILogin, ILoginResponseDTO } from '../use-cases/services/login';
import { LoginDTO } from './dtos/login.dto';
import { ApiResponse } from '@nestjs/swagger';
import { IGenericExceptionResponseDTO } from '@tpf/common';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerWorkerUseCase: IRegisterWorker,
    private readonly loginUseCase: ILogin,
  ) {}

  @Post('sign-in')
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
    type: ILoginResponseDTO,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: IGenericExceptionResponseDTO,
  })
  @HttpCode(HttpStatus.OK)
  signIn(@Body() body: LoginDTO) {
    return this.loginUseCase.execute(body);
  }

  @Post('worker/sign-up')
  @ApiResponse({
    status: 200,
    description: 'Worker registered successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Email or phone already registered',
    type: IGenericExceptionResponseDTO,
  })
  @ApiResponse({
    status: 404,
    description: 'Job occupations or operation cities not found',
    type: IGenericExceptionResponseDTO,
  })
  workerSignUp(@Body() body: RegisterWorkerDTO) {
    return this.registerWorkerUseCase.execute(body);
  }
}
