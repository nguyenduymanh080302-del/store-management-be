import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from 'src/types';
import { AuthService } from './auth.service';
import type { Request } from 'express';
import { GetUser } from 'common/decorators/account.decorator';
import { JwtAccessGuard } from 'common/guards/jwt-access.guard';
import { JwtRefreshGuard } from 'common/guards/jwt-refresh.guard';
import { AccountDto } from 'common/dto/account.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('signup')
  async signup(@Body() payload: Omit<AccountDto, "id">): Promise<ApiResponse<{ accountId: number }>> {
    const data = await this.authService.signup(payload);
    return {
      status: HttpStatus.CREATED,
      message: 'message.account.created',
      data,
    };
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(
    @Body() payload: Pick<AccountDto, "username" | "password">,
    @Req() req: Request
  ): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    const data = await this.authService.signin(payload, req);
    return {
      status: HttpStatus.OK,
      message: 'message.account.signin-success',
      data,
    };
  }

  @UseGuards(JwtAccessGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @GetUser('sessionId') sessionId: number,
  ): Promise<ApiResponse<null>> {
    await this.authService.logout(sessionId);
    return {
      status: HttpStatus.OK,
      message: 'message.account.logout-success',
    };
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @GetUser('accountId') accountId: number,
    @GetUser('sessionId') sessionId: number,
    @GetUser('refreshToken') refreshToken: string,
  ): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    const data = await this.authService.refresh(
      accountId,
      sessionId,
      refreshToken,
    );

    return {
      status: HttpStatus.OK,
      message: 'message.account.refresh-success',
      data,
    };
  }
}
