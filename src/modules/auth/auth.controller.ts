import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RefreshTokenDto } from './dtos/RefreshToken.dto';
import { RefreshGuard } from 'src/common/guards/refresh-token.guard';
import { LoginDto } from './dtos/Login.dto';
import { LocalGuard } from 'src/common/guards/local.guard';
import { GoogleUserType, JWTUserType } from 'src/common/utils/type';
import { CreateAccountDto } from './dtos/CreateAccount.dto';
import { ResponseMsg } from 'src/common/response/response-message';
import { VerifyOtpDto } from 'src/common/mail/dto/verifyOtp.dto';
import { ResetPasswordDto } from './dtos/resetPassword.dto';
import { SendOtpDto } from 'src/common/mail/dto/sendEmail.dto';
import { GoogleAuthGuard } from 'src/common/guards/google.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // POST - Login
  @UseGuards(LocalGuard)
  @ApiOperation({ summary: 'Login with username and password' })
  @ApiBody({ type: LoginDto })
  @Post('login')
  login(@Request() req: { user: JWTUserType }) {
    return this.authService.login(req.user);
  }

  // POST - Register
  @Post('register')
  @ApiOperation({ summary: 'Register new account' })
  @ApiBody({ type: CreateAccountDto })
  register(@Body() body: CreateAccountDto) {
    return this.authService.createAccount(body);
  }

  // POST - Refresh token
  // @UseGuards(RefreshGuard)
  @Post('refreshToken')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh JWT using refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  refreshToken(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body);
  }

  // POST - Logout
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current session' })
  logout(@Request() req: { user: JWTUserType }) {
    return this.authService.logout(req.user);
  }

  @Post('send-otp')
  @ApiBody({ type: SendOtpDto })
  async sendOtp(@Body() body: SendOtpDto) {
    return this.authService.sendOtp(body);
  }

  // =====================
  // VERIFY EMAIL
  // =====================
  @Post('verify-email')
  @ApiBody({ type: VerifyOtpDto })
  async verifyEmail(@Body() body: VerifyOtpDto) {
    return this.authService.verifyEmail(body);
  }

  // =====================
  // RESET PASSWORD
  // =====================
  @Post('reset-password')
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // initiates Google OAuth2 login flow
  }
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleAuthRedirect(@Request() req: { user: GoogleUserType }) {
    return this.authService.loginGoogle(req.user);
  }
}
