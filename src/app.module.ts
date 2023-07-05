import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Teen20Module } from './teen20cron/cron.module';
import { Lucky7euModule } from './lucky7eucron/cron.module';
import { amarAkabrAnthonyModule } from './amarAkbarcron/cron.module';
import { DharamVeerModule } from './dharamVeercron/cron.module';
import { TeenModule } from './teencron/cron.module';
import { DragonTigerModule } from './dragonTigerCron/cron.module';
import { Poker20Module } from './poker20cron/cron.module';
import { PokerModule } from './poker1daycron/cron.module';
import { Poker6Module } from './poker6cron/cron.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/daymonddetailsresult'),
    Teen20Module,
    Lucky7euModule,
    amarAkabrAnthonyModule,
    DharamVeerModule,
    TeenModule,
    DragonTigerModule,
    Poker20Module,
    PokerModule,
    Poker6Module,
  ],
})
export class AppModule {}
