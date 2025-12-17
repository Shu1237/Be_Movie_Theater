import { Module } from '@nestjs/common';
import { QrCodeService } from './qrcode.service';
import { ImagekitModule } from '../imagekit/imagekit.module';

@Module({
  imports: [ImagekitModule],
  providers: [QrCodeService],
  exports: [QrCodeService],
})
export class QrCodeModule {}
