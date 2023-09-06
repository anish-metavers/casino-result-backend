import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { CasinoResult, CasinoResultSchema } from 'model/t_diamond_casino_result';
import { dragonTigerTwentyService } from './cron.service';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.DATABASE_URL),
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: CasinoResult.name, schema: CasinoResultSchema },
    ]),
  ],
  providers: [dragonTigerTwentyService],
})
export class dragonTigerTwentyModule {}