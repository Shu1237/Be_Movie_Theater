import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  MinLength,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from 'src/common/enums/gender.enum';

export class CreateAccountDto {

  @ApiProperty({
    example: 'abc',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    example: '12345678',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: 'Password must not be empty' })
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: 'abc@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    enum: Gender,
    default: Gender.UNKNOWN,
  })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({
    default: 1,
    description: '1: User, 2: Employee, 3: Admin',
  })
  @IsOptional()
  @IsNumber()
  role_id?: number;
}
