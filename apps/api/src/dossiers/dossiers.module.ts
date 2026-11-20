import { Module } from '@nestjs/common';
import { DossiersController } from './dossiers.controller.js';
@Module({controllers:[DossiersController]})
export class DossiersModule {}
