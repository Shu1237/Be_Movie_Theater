import { ApiProperty } from "@nestjs/swagger";

export class ResponseMsg {
  @ApiProperty({ example: "Action completed successfully" })
  message: string;
  constructor(message: string) {
    this.message = message;
  }
  static ok(message = "Action completed successfully") {
    return new ResponseMsg(message);
  }

  static fail(message = "Action failed") {
    return new ResponseMsg(message);
  }
}
