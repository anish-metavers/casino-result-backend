import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { Model } from 'mongoose';
import {
  CasinoResult,
  CasinoResultDocument,
} from 'model/t_diamond_casino_result';

@Injectable()
export class anderBaharService {
  private readonly logger = new Logger(anderBaharService.name);

  constructor(
    @InjectModel(CasinoResult.name)
    private casinoresultModel: Model<CasinoResultDocument>,
  ) {}

  @Cron('*/5 * * * * *')
  async handleCron() {
    const anderBaharGameUrl = 'http://43.205.157.72:3434/casino/ab20DataBig';
    const anderBaharGameResultUrl = 'http://185.180.223.49:9002/result/ab20';
    try {
      const resData = await axios.get(anderBaharGameUrl);
      const WinResult = await axios.get(anderBaharGameResultUrl);

      let data = resData.data.data.data.t1[0];
      let mid = data.mid;
      let gtype = data.gtype;

      let cards = resData.data.data.data.t3[0];
      let aall = cards.aall;
      let ball = cards.ball;

      let winData = JSON.parse(WinResult.data.Data);

      let win;

      const containMid = await this.casinoresultModel.findOneAndUpdate(
        { mid, gtype },
        {
          cards: `${aall},*,${ball}`,
          win: `${win}`,
        },
      );
      let response;
      if (!containMid) {
        response = {
          cards: `${aall},*,${ball}`,
          desc: '',
          gtype: gtype,
          sid: '',
          mid: mid,
          win: `${win}`,
        };

        const amarAkbar = new this.casinoresultModel(response);
        await amarAkbar.save();
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
            await this.casinoresultModel.findOneAndUpdate(
              { mid: dataMid, gtype },
              {
                win: `${win}`,
              },
            );
          }
        }
      }
      this.logger.verbose('ander bahar cron is running');
    } catch (error) {
      console.error(error);
    }
  }
}
