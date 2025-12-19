import { ApiProperty } from '@nestjs/swagger';

export class BaseErrorResponse {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Error' })
  error: string;

  @ApiProperty({ example: 'Error message' })
  message: string | string[];

  constructor(
    statusCode: number,
    error: string,
    message: string | string[],
  ) {
    this.success = false;
    this.statusCode = statusCode;
    this.error = error;
    this.message = message;
  }
}
