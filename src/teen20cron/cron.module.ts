import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { CasinoResult, CasinoResultSchema } from 'model/t_casino_result';
import { Teen20Service } from './cron.service';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017'),
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: CasinoResult.name, schema: CasinoResultSchema },
    ]),
  ],
  providers: [Teen20Service],
})
export class Teen20Module {}
