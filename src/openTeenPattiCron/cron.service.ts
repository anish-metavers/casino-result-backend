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
export class openTeenPattiService {
  private readonly logger = new Logger(openTeenPattiService.name);

  constructor(
    @InjectModel(CasinoResult.name)
    private casinoresultModel: Model<CasinoResultDocument>,
  ) {}

  @Cron('*/5 * * * * *')
  async handleCron() {
    const openTeenPattiUrl = 'http://43.205.157.72:3434/casino/opentpDataBig';
    const openTeenPattiResultUrl = 'http://185.180.223.49:9002/result/teen8';
    try {
      const resData = await axios.get(openTeenPattiUrl);
      const WinResult = await axios.get(openTeenPattiResultUrl);

      let data = resData.data.data.data.t1[0];

      let card = data.cards;
      let mid = data.mid;
      let gtype = data.gtype;
      let response;

      let resultData = JSON.parse(WinResult.data.Data);

      let win;

      const containMid = await this.casinoresultModel.findOneAndUpdate(
        { mid, gtype },
        {
          cards: `${card}`,
          win: `${win}`,
          desc: '',
          sid:
            card.toString()?.split('#')?.[1]?.split(' ')[1] || 'not declared',
        },
      );

      if (mid != 0) {
        if (!containMid) {
          response = {
            cards: '',
            desc: '',
            nat: '',
            gtype: gtype,
            mid: mid,
            sid: '',
            win: '',
          };
          const amarAkbar = new this.casinoresultModel(response);
          await amarAkbar.save();
        }
      }

      //result set
      const setResult = await this.casinoresultModel.find({
        win: 'undefined',
        gtype,
      });

      let dataMid, resultMid, winnerName;
      for (let item of setResult) {
        dataMid = item.mid;
        for (let wins of resultData.data) {
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

      this.logger.verbose('open teen patti cron is running');
    } catch (error) {
      console.error(error);
    }
  }
}
