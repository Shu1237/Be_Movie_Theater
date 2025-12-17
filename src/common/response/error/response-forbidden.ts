import { ApiProperty } from "@nestjs/swagger";

export class ResponseForbidden {
  @ApiProperty({ example: "Forbidden" })
  message: string;

  @ApiProperty({ example: 403 })
  statusCode: number;

  constructor(message = "Forbidden", statusCode = 403) {
    this.message = message;
    this.statusCode = statusCode;
  }

  static error(message = "Forbidden", statusCode = 403) {
    return new ResponseForbidden(message, statusCode);
  }
}
