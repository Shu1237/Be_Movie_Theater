import { Body, Controller, Get,  Query } from "@nestjs/common";
import { MomoService } from "./momo.service";
import { ApiExcludeEndpoint } from "@nestjs/swagger";

@Controller("payment/momo")
export class MomoController {
  constructor(private readonly momoService: MomoService) {}
  @ApiExcludeEndpoint()
  @Get("return")
  handleMomoReturn(@Query() query: Record<string, string>) {
    return this.momoService.handleReturn(query);
  }

  
}