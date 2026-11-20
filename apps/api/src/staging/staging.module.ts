import { Module } from '@nestjs/common';
import { LegacyModule } from '../legacy/legacy.module.js';
import { StagingController } from './staging.controller.js';
@Module({ imports: [LegacyModule], controllers: [StagingController] })
export class StagingModule {}
