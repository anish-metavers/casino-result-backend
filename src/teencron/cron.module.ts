import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TeenService } from './cron.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CasinoResult, CasinoResultSchema } from 'model/t_casino_result';
@Module({
  imports: [
    // MongooseModule.forRoot('mongodb://localhost:27017'),
    MongooseModule.forRoot(process.env.DATABASE_URL),
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: CasinoResult.name, schema: CasinoResultSchema },
    ]),
  ],
  providers: [TeenService],
})
export class TeenModule {}
