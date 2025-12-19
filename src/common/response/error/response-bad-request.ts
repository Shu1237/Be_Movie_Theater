import { ApiProperty } from '@nestjs/swagger';

export class ResponseBadRequest {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({ example: ['Invalid request'] })
  message: string[];

  constructor(
    message: string[] = ['Invalid request'],
    statusCode = 400,
    error = 'Bad Request',
  ) {
    this.message = message;
    this.statusCode = statusCode;
    this.error = error;
  }
}
