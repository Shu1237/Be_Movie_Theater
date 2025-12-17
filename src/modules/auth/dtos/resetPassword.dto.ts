import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MinLength, IsEmail } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty({
    example: "user@example.com",
    description: "Email of the account",
  })
  @IsEmail({}, { message: "Invalid email" })
  email: string;

  @ApiProperty({
    example: "secretPassword",
    description: "Password of the account",
  })
  @IsString()
  @IsNotEmpty({ message: "Password must not be empty" })
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  new_password: string;
}
