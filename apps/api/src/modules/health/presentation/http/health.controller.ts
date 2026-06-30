import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

export type HealthResponse = {
  status: 'ok';
  service: 'orderflow-api';
  timestamp: string;
};

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({ description: 'API process is healthy.' })
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'orderflow-api',
      timestamp: new Date().toISOString(),
    };
  }
}
