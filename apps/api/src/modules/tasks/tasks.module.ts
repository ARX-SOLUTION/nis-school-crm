import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BillingModule } from '../billing/billing.module';
import { ParentsModule } from '../parents/parents.module';
import { TasksService } from './tasks.service';

@Module({
  imports: [AuthModule, ParentsModule, BillingModule],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
