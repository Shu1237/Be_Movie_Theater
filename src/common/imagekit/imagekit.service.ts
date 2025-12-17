import { Injectable, Inject } from "@nestjs/common";
import ImageKit from "imagekit";
import { InternalServerErrorException } from "../exceptions/internal-server-error.exception";
import { ResponseDetail } from "../response/response-detail-create-update";

export enum ImageFolder {
  USER = "BE_Moive_Theater/users",
  ORDER = "BE_Moive_Theater/orders",
  AVATAR= "BE_Moive_Theater/avatars",
}

@Injectable()
export class ImagekitService {
  constructor(@Inject("IMAGEKIT") private readonly imagekit: ImageKit) {}

  private async uploadToFolder(fileBuffer: Buffer, fileName: string, folder: ImageFolder): Promise<{ url: string; fileId: string }> {
    try {
      const result = await this.imagekit.upload({
        file: fileBuffer.toString("base64"),
        fileName,
        folder,
        useUniqueFileName: true,
      });
      return { url: result.url, fileId: result.fileId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new InternalServerErrorException(`Image upload failed: ${errorMessage}`);
    }
  }



  async uploadUserImage(fileBuffer: Buffer, fileName: string): Promise<ResponseDetail<{ url: string; fileId: string }>> {
    const result = await this.uploadToFolder(fileBuffer, fileName, ImageFolder.USER);
    return ResponseDetail.ok(result);
  }

  async uploadOrderImage(fileBuffer: Buffer, fileName: string): Promise<ResponseDetail<{ url: string; fileId: string }>> {
    const result = await this.uploadToFolder(fileBuffer, fileName, ImageFolder.ORDER);
    return ResponseDetail.ok(result);
  } 

  async uploadAvatarImage(fileBuffer: Buffer, fileName: string): Promise<ResponseDetail<{ url: string; fileId: string }>> {
    const result = await this.uploadToFolder(fileBuffer, fileName, ImageFolder.AVATAR);
    return ResponseDetail.ok(result);
  }
  async deleteImage(fileId: string): Promise<void> {
    try {
      await this.imagekit.deleteFile(fileId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new InternalServerErrorException(`Image deletion failed: ${errorMessage}`);
    }
  }

  getAuthParams() {
    try {
      return this.imagekit.getAuthenticationParameters();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new InternalServerErrorException(`Failed to get auth params: ${errorMessage}`);
    }
  }
}
