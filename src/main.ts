import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './config/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    bodyParser: true,
  });

  app.setGlobalPrefix('api');
  app.enableCors();

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Ops desk api')
    .setDescription('The OpsDesk API description')
    .setVersion('1.0')
    .addTag('opsDesk')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, swaggerDocument);

  const outputDir = join(process.cwd(), 'locals');
  const outputFile = join(outputDir, 'swagger.json');

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const swaggerJson = JSON.stringify(swaggerDocument, null, 2);

  writeFileSync(outputFile, swaggerJson, { encoding: 'utf-8' });

  console.log(`Swagger file saved at: ${outputFile}`);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
