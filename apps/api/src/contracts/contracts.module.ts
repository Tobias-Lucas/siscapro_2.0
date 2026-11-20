import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller.js';
import { ContractsWorkflowController } from './contracts-workflow.controller.js';
@Module({controllers:[ContractsController,ContractsWorkflowController]}) export class ContractsModule {}
