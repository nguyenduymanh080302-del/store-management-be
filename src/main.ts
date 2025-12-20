import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, HttpStatus, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.setGlobalPrefix("api/v1")
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
      exceptionFactory: (errors) => {
        const firstError = errors[0];
        const firstMessage =
          firstError &&
          firstError.constraints &&
          Object.values(firstError.constraints)[0];

        return new BadRequestException({
          status: HttpStatus.BAD_REQUEST,
          message: firstMessage ?? 'message.validation-failed',
        });
      },
    }),
  );
  const port = process.env.PORT || 3000;
  console.log(`Server is running on http://localhost:${port}/api/v1`);
  await app.listen(port);
}
bootstrap();
