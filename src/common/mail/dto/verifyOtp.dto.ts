import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsEmail } from "class-validator";

export class VerifyOtpDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail({}, { message: "Invalid email" })
  email: string;

  @ApiProperty({ example: "123456", description: "The OTP code sent to your email" })
  @IsString({ message: "OTP must be a string" })
  otp: string;
}
