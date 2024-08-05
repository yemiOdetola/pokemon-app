import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, SignupDto } from './dto';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signin')
  async signin(@Body() req: AuthDto) {
    return this.authService.signin(req);
  }

  @Post('signup')
  async signup(@Body() req: SignupDto) {
    return this.authService.signup(req);
  }
}
