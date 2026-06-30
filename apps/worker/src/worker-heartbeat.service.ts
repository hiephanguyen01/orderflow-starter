import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

@Injectable()
export class WorkerHeartbeatService {
  private readonly logger = new Logger(WorkerHeartbeatService.name);

  @Interval(60_000)
  heartbeat(): void {
    this.logger.debug('Worker heartbeat');
  }
}
