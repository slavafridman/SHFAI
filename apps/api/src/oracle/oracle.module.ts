import { Module } from '@nestjs/common';
import { loadOracleConfiguration } from './configuration.js';
import { OracleReadOnlyDatabase } from './read-only-database.js';

@Module({
  providers: [{
    provide: OracleReadOnlyDatabase,
    useFactory: () => new OracleReadOnlyDatabase(loadOracleConfiguration(process.env)),
  }],
  exports: [OracleReadOnlyDatabase],
})
export class OracleReadOnlyModule {}
