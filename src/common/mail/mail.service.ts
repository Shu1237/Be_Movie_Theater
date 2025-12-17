import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";
import { InternalServerErrorException } from "../exceptions/internal-server-error.exception";

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendOtp(email: string, code: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: "Your OTP Code",
        template: "./otp",
        context: {
          email: email,
          code: code,
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      throw new InternalServerErrorException(error.message);
    }
  }

  async sendBookingConfirmation(data: {
    email: string;
    renterName: string;
    bookingId: string;
    rentalStartDate: Date;
    expectedReturnDate?: Date;
    totalAmount: number;
    rentalFee: number;
    depositFee: number;
    transactionCode?: string;
  }) {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: "Booking Confirmation - EV Rental System",
        template: "./booking-confirmation",
        context: {
          renterName: data.renterName,
          bookingId: data.bookingId,
          rentalStartDate: data.rentalStartDate,
          expectedReturnDate: data.expectedReturnDate,
          totalAmount: data.totalAmount,
          rentalFee: data.rentalFee,
          depositFee: data.depositFee,
          transactionCode: data.transactionCode,
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      throw new InternalServerErrorException(error.message);
    }
  }
}
