import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import {
  CasinoResult,
  CasinoResultDocument,
} from 'model/t_diamond_casino_result';
import { Model } from 'mongoose';

@Injectable()
export class PokerOneDayService {
  private readonly logger = new Logger(PokerOneDayService.name);

  constructor(
    @InjectModel(CasinoResult.name)
    private casinoresultModel: Model<CasinoResultDocument>,
  ) {}

  @Cron('*/5 * * * * *')
  async handleCron() {
    const poker1DayUrl = 'http://185.180.223.49:9002/data/poker';
    const poker1DayWinResultUrl = 'http://185.180.223.49:9002/result/poker';
    try {
      const pokerResData = await axios.get(poker1DayUrl);
      const pokerWinResult = await axios.get(poker1DayWinResultUrl);

      let data = JSON.parse(pokerResData.data.Data);
      let winData = JSON.parse(pokerWinResult.data.Data);

      let card, response, mid, gtype, desc;
      for (let item of data.t1) {
        desc = item.desc;
        mid = item.mid;
        gtype = item.gtype;
        card = `${item.C1},${item.C2},${item.C3},${item.C4},${item.C5},${item.C6},${item.C7},${item.C8},${item.C9}`;
      }

      let win;
      const containMid = await this.casinoresultModel.findOneAndUpdate(
        { mid, gtype },
        {
          cards: card,
          desc: `${desc}`,
          win: `${win}`,
        },
      );
      if (mid != 0) {
        if (!containMid) {
          response = {
            cards: card,
            desc: `${desc}`,
            gtype: gtype,
            sid: '',
            mid: mid,
            win: `${win}`,
          };
          const poker20Response = new this.casinoresultModel(response);
          await poker20Response.save();
        }
      }

      //result set
      const setResult = await this.casinoresultModel.find({
        win: 'undefined',
        gtype,
      });

      let dataMid, resultMid;
      for (let item of setResult) {
        dataMid = item.mid;
        for (let wins of winData.data) {
          resultMid = wins.mid;
          if (resultMid == dataMid) {
            win = wins.result;
          }
          await this.casinoresultModel.findOneAndUpdate(
            { mid: dataMid, gtype: gtype },
            {
              sid: `${win}`,
              win: `${win}`,
            },
          );
        }
      }
      this.logger.debug('Poker 1 day cron is running');
    } catch (error) {
      console.log(error);
    }
  }
}
