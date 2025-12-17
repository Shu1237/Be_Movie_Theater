// login.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'string', description: 'Username of the account' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    example: '12345678',
    description: 'Password of the account',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
