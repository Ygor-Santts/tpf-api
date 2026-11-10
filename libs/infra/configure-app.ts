import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import {
  HttpExceptionReturnInterceptor,
  validationExceptionFactory,
} from '@tpf/common';
import { join } from 'path';
import { mkdirSync } from 'fs';

// Everything main.ts sets up besides Swagger and listening, so the e2e tests
// run the API exactly as it runs on the server.
export function configureApp(app: NestExpressApplication) {
  const uploadsDir = join(process.cwd(), 'uploads');
  mkdirSync(uploadsDir, { recursive: true });
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });
  app.enableCors();

  app.useGlobalInterceptors(new HttpExceptionReturnInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
}
