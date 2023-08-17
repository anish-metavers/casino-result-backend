import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CasinoResultDocument, CasinoResult } from 'model/t_casino_result';

@Injectable()
export class TeenpattiService {
  private readonly logger = new Logger(TeenpattiService.name);

  constructor(
    @InjectModel(CasinoResult.name)
    private casinoresultModel: Model<CasinoResultDocument>,
  ) {}
  @Cron('*/5 * * * * *')
  async handleCron() {
    const teenUrl = 'http://185.180.223.49:9002/data/Teen';
    const teenWinResultUrl = 'http://185.180.223.49:9002/result/Teen';
    try {
      const resData = await axios.get(teenUrl);
      const winResult = await axios.get(teenWinResultUrl);

      let data = JSON.parse(resData.data.Data);
      let winData = JSON.parse(winResult.data.Data);

      let cards = [],
        win,
        response;

      let gType, mid;
      for (let items of data.bf) {
        mid = items.marketId;
        cards.push(items.C1 ?? '');
        cards.push(items.C2 ?? '');
        cards.push(items.C3 ?? '');
        gType = items.gameType;
      }

      const containMid = await this.casinoresultModel.findOneAndUpdate(
        { mid },
        {
          cards: cards.join(','),
          win: `${win}`,
          desc: '',
        },
      );

      if (mid != 0) {
        if (!containMid) {
          response = {
            cards: cards.join(','),
            desc: '',
            gtype: gType,
            sid: '',
            mid: mid,
            win: `${win}`,
          };
          const teenResponse = new this.casinoresultModel(response);
          await teenResponse.save();
        }
      }

      //set win result
      const teenSetResult = await this.casinoresultModel.find({
        win: 'undefined',
      });

      let dataMid, resultMid;
      for (let item of teenSetResult) {
        dataMid = item.mid;
        for (let wins of winData.data) {
          resultMid = wins.mid;
          if (dataMid == resultMid) {
            win = wins.result;
          }
          await this.casinoresultModel.findOneAndUpdate(
            { mid: dataMid, gtype: gType },
            {
              win: `${win}`,
            },
          );
        }
      }

      this.logger.verbose('Teen cron is running');
    } catch (error) {
      console.error(error);
    }
  }
}
