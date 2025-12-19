import { ApiProperty } from '@nestjs/swagger';

export class ResponseMsg {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Action completed successfully' })
  message: string;

  constructor(message: string, success = true) {
    this.message = message;
    this.success = success;
  }

  static ok(message = 'Action completed successfully') {
    return new ResponseMsg(message, true);
  }

  static fail(message = 'Action failed') {
    return new ResponseMsg(message, false);
  }
}
