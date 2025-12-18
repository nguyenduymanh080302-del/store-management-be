import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { sign } from 'crypto';
import { SigninDto, SignupDto } from 'common/dto/auth.dto';
import { ApiResponse } from 'common/types';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {
  }
  @Post(`/signup`)
  signup(@Body() payload: SignupDto): Promise<ApiResponse<any>> {
    return this.authService.signup(payload);
  }

  @Post(`/signin`)
  signin() {
    this.authService.signin();
  }

  @Post(`/logout`)
  logout() {
    this.authService.logout();
  }

  @Post(`/refresh`)
  refresh() {
    this.authService.refresh();
  }
}
