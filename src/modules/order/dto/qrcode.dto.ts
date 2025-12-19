import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ScanQrCodeDto {
  @ApiProperty({
    description: 'QR code data to be scanned',
    example: 'sample-qrcode-data',
  })
  @IsString()
  @IsNotEmpty()
  qrCode: string;
}
