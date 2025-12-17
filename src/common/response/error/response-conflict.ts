import { ApiProperty } from "@nestjs/swagger";

export class ResponseConflict {
  @ApiProperty({ example: "Conflict" })
  message: string;

  @ApiProperty({ example: 409 })
  statusCode: number;

  constructor(message = "Conflict", statusCode = 409) {
    this.message = message;
    this.statusCode = statusCode;
  }

  static error(message = "Conflict", statusCode = 409) {
    return new ResponseConflict(message, statusCode);
  }
}
