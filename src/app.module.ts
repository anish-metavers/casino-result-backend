import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { TeenTwentyModule } from './teenTwentyCron/cron.module';
import { LuckySevenModule } from './luckySevenCron/cron.module';
import { amarAkabrAnthonyModule } from './amarAkbarAnthonyCron/cron.module';
import { BollywoodTableModule } from './bollywoodTableCron/cron.module';
import { TeenpattiModule } from './teenpattiCron/cron.module';
import { DragonTigerModule } from './dragonTigerCron/cron.module';
import { PokerTwentyModule } from './pokerTwentyCron/cron.module';
import { PokerOneDayModule } from './pokerOneDayCron/cron.module';
import { PokerSixModule } from './pokerSixCron/cron.module';
import { anderBaharModule } from './anderBaharCron/cron.module';
import { openTeenPattiModule } from './openTeenPattiCron/cron.module';
import { lucky7aModule } from './luckySevenACron/cron.module';
import { dragonTigerTwentyModule } from './dragonTigerTwentyCron/cron.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.DATABASE_URL),
    amarAkabrAnthonyModule,
    BollywoodTableModule,
    LuckySevenModule,
    lucky7aModule,
    PokerTwentyModule,
    PokerOneDayModule,
    PokerSixModule,
    anderBaharModule,
    openTeenPattiModule,
    TeenpattiModule,
    TeenTwentyModule,
    dragonTigerTwentyModule,
    DragonTigerModule,
  ],
})
export class AppModule {}
