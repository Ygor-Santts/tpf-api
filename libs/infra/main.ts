import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { configureApp } from './configure-app';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  configureApp(app);

  const config = new DocumentBuilder()
    .setTitle('TPF API')
    .setDescription('API do Trampo Fácil')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, documentFactory);

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT, () => {
    console.log(`Running in ${process.env.NODE_ENV} mode`);
    console.log(`Listening on port ${PORT}`);
  });
}
bootstrap();
