import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
// import { Lucky7eu, Lucky7euSchema } from 'model/t_lucky7eu';
import { CasinoResult, CasinoResultSchema } from 'model/t_casino_result';
import { Lucky7euService } from './cron.service';

@Module({
  imports: [
    // MongooseModule.forRoot('mongodb://localhost:27017'),
    MongooseModule.forRoot(process.env.DATABASE_URL),
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: CasinoResult.name, schema: CasinoResultSchema },
    ]),
  ],
  providers: [Lucky7euService],
})
export class Lucky7euModule {}
