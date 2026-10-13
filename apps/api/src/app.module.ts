import { Module } from '@nestjs/common';
import { OracleReadOnlyModule } from './oracle/oracle.module.js';

@Module({ imports: [OracleReadOnlyModule] })
export class AppModule {}
