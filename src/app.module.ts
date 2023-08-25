import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeenTwentyModule } from './teenTwentyCron/cron.module';
import { LuckySevenModule } from './luckySevenCron/cron.module';
import { amarAkabrAnthonyModule } from './amarAkbarAnthonyCron/cron.module';
import { BollywoodTableModule } from './bollywoodTableCron/cron.module';
import { TeenpattiModule } from './teenpattiCron/cron.module';
import { DragonTigerModule } from './dragonTigerCron/cron.module';
import { PokerTwentyModule } from './pokerTwentyCron/cron.module';
import { PokerOneDayModule } from './pokerOneDayCron/cron.module';
import { PokerSixModule } from './pokerSixCron/cron.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    // MongooseModule.forRoot('mongodb://localhost:27017/daymonddetailsresult'),
    MongooseModule.forRoot(process.env.DATABASE_URL),
    // TeenTwentyModule,
    // amarAkabrAnthonyModule,
    // BollywoodTableModule,
    // LuckySevenModule,
    // TeenpattiModule,
    DragonTigerModule,
    // PokerTwentyModule,
    // PokerOneDayModule,
    // PokerSixModule,
  ],
})
export class AppModule {}
