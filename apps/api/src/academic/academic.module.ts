import { Module } from '@nestjs/common';
import { AcademicController } from './academic.controller.js';
import { AttendanceBoardController } from './attendance-board.controller.js';
import { CurriculumController } from './curriculum.controller.js';
@Module({controllers:[AcademicController,AttendanceBoardController,CurriculumController]}) export class AcademicModule {}
