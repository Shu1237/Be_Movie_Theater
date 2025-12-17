import { ApiProperty } from "@nestjs/swagger";

export class ResponseUnauthorized {
  @ApiProperty({ example: "Unauthorized" })
  message: string;

  @ApiProperty({ example: 401 })
  statusCode: number;

  constructor(message = "Unauthorized", statusCode = 401) {
    this.message = message;
    this.statusCode = statusCode;
  }

  static error(message = "Unauthorized", statusCode = 401) {
    return new ResponseUnauthorized(message, statusCode);
  }
}
