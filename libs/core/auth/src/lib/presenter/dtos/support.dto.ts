import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export const SUPPORT_TOPICS = {
  duvida: 'Dúvida sobre o app',
  problema: 'Algo não funciona',
  conta: 'Minha conta',
  denuncia: 'Denunciar um perfil',
  sugestao: 'Sugestão',
  outro: 'Outro assunto',
} as const;

export type SupportTopic = keyof typeof SUPPORT_TOPICS;

export interface ISupportMessageDTO {
  name: string;
  email: string;
  topic: SupportTopic;
  message: string;
}

export abstract class SupportMessageDTO implements ISupportMessageDTO {
  @ApiProperty({ example: 'Maria Souza' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'maria@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ enum: Object.keys(SUPPORT_TOPICS), example: 'duvida' })
  @IsIn(Object.keys(SUPPORT_TOPICS), { message: 'Escolha um assunto.' })
  topic!: SupportTopic;

  @ApiProperty({ example: 'Não consigo adicionar fotos no portfólio.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  message!: string;
}
