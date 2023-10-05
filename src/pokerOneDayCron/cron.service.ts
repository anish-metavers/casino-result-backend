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
    // const poker1DayUrl = 'http://185.180.223.49:9002/data/poker';
    const dataUrl = 'http://43.205.157.72:3434/casino/1daypDataBig';
    const ResultUrl = 'http://185.180.223.49:9002/result/poker';
    try {
      let pokerResData = await axios.get(dataUrl);
      let item = pokerResData.data.data.data.t1[0];
      const mid = item.mid;
      const card = `${item.C1},${item.C2},${item.C3},${item.C4},${item.C5},${item.C6},${item.C7},${item.C8},${item.C9}`;
      const desc = `${item.desc}`;
      const gtype = pokerResData.data.data.data.t2[0].gtype;

      const pokerWinResult = await axios.get(ResultUrl);
      let winData = JSON.parse(pokerWinResult.data.Data);

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
        let response;
        if (!containMid) {
          response = {
            cards: card,
            desc: '',
            gtype: gtype,
            sid: '',
            mid: mid,
            win: '',
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
