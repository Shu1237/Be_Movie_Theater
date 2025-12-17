import { Controller, Get, Req } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  someProtectedRoute() {
    return { message: 'Accessed Resource' };
  }
}
