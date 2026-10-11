import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from './app.module';

async function generateOpenApi(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('v1', { exclude: ['health', 'ready'] });

  const config = new DocumentBuilder()
    .setTitle('Sistema Odontológico API')
    .setDescription('API REST del Sistema de Gestión para Consultorio Odontológico')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const outputPath = path.resolve(__dirname, '../openapi.json');
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2), 'utf-8');

  console.log(`OpenAPI schema generado exitosamente en ${outputPath}`);
  await app.close();
}

generateOpenApi().catch((err) => {
  console.error('Error generando OpenAPI:', err);
  process.exit(1);
});
