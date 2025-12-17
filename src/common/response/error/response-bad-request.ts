import { ApiProperty } from "@nestjs/swagger";

export class ResponseBadRequest {
  @ApiProperty({ example: ["Invalid request"] })
  message: string[];

  @ApiProperty({ example: 400 })
  statusCode: number;

  constructor(message = ["Invalid request"], statusCode = 400) {
    this.message = message;
    this.statusCode = statusCode;
  }

  static error(message = ["Invalid request"], statusCode = 400) {
    return new ResponseBadRequest(message, statusCode);
  }
}
