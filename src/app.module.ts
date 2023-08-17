import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeenTwentyModule } from './teenTwentyCron/cron.module';
import { Lucky7euModule } from './lucky7euCron/cron.module';
import { amarAkabrAnthonyModule } from './amarAkbarAnthonyCron/cron.module';
import { BollywoodTableModule } from './bollywoodTableCron/cron.module';
import { TeenModule } from './teenCron/cron.module';
import { DragonTigerModule } from './dragonTigerCron/cron.module';
import { Poker20Module } from './poker20Cron/cron.module';
import { PokerModule } from './poker1DayCron/cron.module';
import { Poker6Module } from './poker6Cron/cron.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    // MongooseModule.forRoot('mongodb://localhost:27017/daymonddetailsresult'),
    MongooseModule.forRoot(process.env.DATABASE_URL),
    TeenTwentyModule,
    Lucky7euModule,
    amarAkabrAnthonyModule,
    BollywoodTableModule,
    TeenModule,
    DragonTigerModule,
    Poker20Module,
    PokerModule,
    Poker6Module,
  ],
})
export class AppModule {}
