import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { GoogleUserType, JWTUserType } from 'src/common/utils/type';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { User } from 'src/database/entities/user/user';
import { RefreshToken } from 'src/database/entities/user/refresh-token';
import { Role } from 'src/database/entities/user/roles';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { ForbiddenException } from 'src/common/exceptions/forbidden.exception';
import { ConfigService } from '@nestjs/config';
import { QrCodeService } from 'src/common/qrcode/qrcode.service';
import { comparePassword, hashPassword } from 'src/common/utils/helper';
import { UnauthorizedException } from 'src/common/exceptions/unauthorized.exception';
import { ResponseMsg } from 'src/common/response/response-message';
import { randomInt } from 'crypto';
import { SendOtpDto } from 'src/common/mail/dto/sendEmail.dto';
import { MailService } from 'src/common/mail/mail.service';
import Redis from 'ioredis';
import { CreateAccountDto } from './dtos/CreateAccount.dto';
import { VerifyOtpDto } from 'src/common/mail/dto/verifyOtp.dto';
import { ResetPasswordDto } from './dtos/resetPassword.dto';
import { RefreshTokenDto } from './dtos/RefreshToken.dto';
import { ResponseDetail } from 'src/common/response/response-detail-create-update';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,

    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    private jwtService: JwtService,
    private configService: ConfigService,
    private qrcodeService: QrCodeService,
    private mailService: MailService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { username: username },
      relations: ['role'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Wrong password');
    }
    if (!user.status) {
      throw new UnauthorizedException('Account is disabled');
    }
    const result: JWTUserType = {
      account_id: user.id,
      username: user.username,
      role_id: user.role.role_id,
      email: user.email,
      provider: user.provider,
    };
    return result;
  }
  async checkStatus(payload: JWTUserType): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: payload.account_id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.status) {
      throw new ForbiddenException('Account is disabled');
    }
  }
  async validateRefreshToken(token: string) {
    const record = await this.refreshTokenRepository.findOne({
      where: { refresh_token: token, revoked: false },
      relations: ['user', 'user.role'],
    });

    if (!record || record.expires_at.getTime() < Date.now()) {
      return null;
    }

    record.revoked = true;
    await this.refreshTokenRepository.save(record);

    const payload: JWTUserType = {
      account_id: record.user.id,
      username: record.user.username,
      role_id: record.user.role.role_id,
      email: record.user.email,
      provider: record.user.provider,
    };

    return payload;
  }
  async login(user: JWTUserType) :Promise<ResponseDetail<{msg:string, token: {access_token: string, refresh_token: string}}>> {
    const redisKey = `user-${user.account_id}`;
    const existingRefreshToken = await this.redisClient.get(redisKey);
    if (existingRefreshToken) {
      await this.redisClient.del(redisKey);
    }
    return ResponseDetail.ok({
      msg: 'Login successful',
      token: await this.generateToken(user),
    })
  }

  async loginGoogle(user: GoogleUserType) :Promise<ResponseDetail<{msg:string, token: {access_token: string, refresh_token: string}}>> {
    // check if user exists
    const existingUser = await this.userRepository.findOne({
      where: { email: user.email },
      relations: ['role'],
    });
    let payload: JWTUserType;
    if (existingUser) {
      payload = {
        account_id: existingUser.id,
        username: existingUser.username,
        email: existingUser.email,
        provider: existingUser.provider,
        role_id: existingUser.role.role_id,
      };
    } else {
      const role = await this.roleRepository.findOneBy({ role_id: 1 });
      if (!role) {
        throw new NotFoundException('Default role not found');
      }
      const newUser = this.userRepository.create({
        email: user.email,
        username: user.email.split('@')[0],
        password: await hashPassword(uuidv4()),
        avatar: user.avatar ?? undefined,
        provider: 'google',
        role,
      });
      const savedUser = await this.userRepository.save(newUser);
      const qrCode = await this.qrcodeService.generateUserCode(
        savedUser.id.toString(),
      );
      await this.userRepository.update(savedUser.id, {
        qr_code: qrCode.data?.url,
      });

      payload = {
        account_id: savedUser.id,
        username: savedUser.username,
        role_id: savedUser.role.role_id,
        email: savedUser.email,
        provider: savedUser.provider,
      };
    }
    return ResponseDetail.ok({
      msg: 'Login successful',
      token: await this.generateToken(payload),
    })
  }

  async createAccount(data: CreateAccountDto): Promise<ResponseMsg> {
    const roleId = data.role_id ?? 1;
    if (roleId > 3 || roleId < 1) {
      throw new Error('ROLE_ID must be between 1 and 3');
    }

    const role = await this.roleRepository.findOneBy({ role_id: roleId });
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    const existingAccount = await this.userRepository.findOneBy({
      email: data.email,
    });
    if (existingAccount) {
      throw new UnauthorizedException('Email already exists');
    }

    const existingUsername = await this.userRepository.findOneBy({
      username: data.username,
    });
    if (existingUsername) {
      throw new UnauthorizedException('Username already exists');
    }

    const hashedPassword = await hashPassword(data.password);
    const { role_id, ...accountData } = data;

    const newAccount = this.userRepository.create({
      ...accountData,
      password: hashedPassword,
      role,
    });

    const savedAccount = await this.userRepository.save(newAccount);

    const qrCode = await this.qrcodeService.generateUserCode(
      savedAccount.id.toString(),
    );

    await this.userRepository.update(savedAccount.id, {
      qr_code: qrCode.data?.url,
    });

    return ResponseMsg.ok('Create account successfully');
  }
  async generateToken(payload: JWTUserType):Promise<{access_token: string, refresh_token: string}> {
    const access_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });
    const user = await this.userRepository.findOne({
      where: { id: payload.account_id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const refresh_token = uuidv4();
    // storage redis
    await this.redisClient.set(
      `user-${user.id}`,
      refresh_token,
      'EX',
      3 * 24 * 60 * 60,
    );
    return {
      access_token,
      refresh_token,
    }

    
  }

  async refreshToken(data: RefreshTokenDto) : Promise<ResponseDetail<{access_token: string}>> {
    if (!data.refresh_token) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const keys = await this.redisClient.keys('user-*');

    let userId: string | null = null;

    for (const key of keys) {
      const storedToken = await this.redisClient.get(key);
      if (storedToken === data.refresh_token) {
        userId = key.replace('user-', '');
        break;
      }
    }

    if (!userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload: JWTUserType = {
      account_id: user.id,
      username: user.username,
      role_id: user.role.role_id,
      email: user.email,
      provider: user.provider,
    };

    const access_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });

    return ResponseDetail.ok({ access_token });
  }

  async logout(user: JWTUserType): Promise<ResponseMsg> {
    const redisKey = `user-${user.account_id}`;

    const existed = await this.redisClient.get(redisKey);

    if (!existed) {
      return ResponseMsg.ok('Already logged out');
    }

    await this.redisClient.del(redisKey);

    return ResponseMsg.ok('Logout successful');
  }

  private generateCode(): string {
    const otpCode = randomInt(100000, 999999).toString();
    return otpCode;
  }
  async sendOtp(data: SendOtpDto): Promise<ResponseMsg> {
    const randomCode = this.generateCode();
    await this.mailService.sendOtp(data.email, randomCode);
    await this.redisClient.set(`otp-${data.email}`, randomCode, 'EX', 300);
    return ResponseMsg.ok('Send OTP successfully');
  }
  async verifyEmail(data: VerifyOtpDto): Promise<ResponseMsg> {
    const checkOtp = await this.redisClient.get(`otp:${data.email}`);
    if (!checkOtp || checkOtp !== data.otp) {
      throw new ForbiddenException('Invalid OTP');
    }
    await this.redisClient.del(`otp:${data.email}`);
    return ResponseMsg.ok('Verify email successfully');
  }
  async resetPassword(data: ResetPasswordDto): Promise<ResponseMsg> {
    // check user
    const user = await this.userRepository.findOne({
      where: { email: data.email },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const newPasswordHash = await hashPassword(data.new_password);
    user.password = newPasswordHash;
    await this.userRepository.save(user);
    return ResponseMsg.ok('Reset password successfully');
  }
}
