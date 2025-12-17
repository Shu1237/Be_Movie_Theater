import { Injectable } from '@nestjs/common';
import * as qrcode from 'qrcode';
import { ImagekitService } from '../imagekit/imagekit.service';


@Injectable()
export class QrCodeService {
  constructor(private readonly imagekitService: ImagekitService) {}

  async generateUserCode(data: string){
    const qrCodeBuffer = await qrcode.toBuffer(data, { type: 'png' });
    const fileName = `user-${Date.now()}.png`;
    const uploadResult = await this.imagekitService.uploadUserImage(qrCodeBuffer, fileName);
    return uploadResult;
  }

  async generateQrCode(data: string){
    const qrCodeBuffer = await qrcode.toBuffer(data, { type: 'png' });
    const fileName = `qrcode-${Date.now()}.png`;
    const uploadResult = await this.imagekitService.uploadOrderImage(qrCodeBuffer, fileName);
    return uploadResult;
  }
}
