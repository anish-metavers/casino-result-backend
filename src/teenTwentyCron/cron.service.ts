import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { CasinoResult, CasinoResultDocument } from 'model/t_casino_result';
import { Model } from 'mongoose';

@Injectable()
export class TeenTwentyService {
  private readonly logger = new Logger(TeenTwentyService.name);

  constructor(
    @InjectModel(CasinoResult.name)
    private casinoresultModel: Model<CasinoResultDocument>,
  ) {}

  @Cron('*/5 * * * * *')
  async handleCron() {
    const teen20WinResultUrl = 'http://185.180.223.49:9002/result/teen20';
    const teen20DataUrl = 'http://185.180.223.49:9002/data/teen20';
    try {
      const resData = await axios.get(teen20DataUrl);
      const WinResult = await axios.get(teen20WinResultUrl);

      let teen20Data = JSON.parse(resData.data.Data);
      let teen20WinData = JSON.parse(WinResult.data.Data);
      let cards, win, response;

      let gType;
      for (let items of teen20Data.t1) {
        cards = `${items.C1},${items.C4},${items.C2},${items.C5},${items.C3},${items.C6}`;
        gType = items.gtype;
      }

      let sid = [];
      let mid;
      let items = teen20Data.t2;
      items.forEach((item) => {
        sid.push(item.sid);
        mid = item.mid;
      });

      const teen20ContainMid = await this.casinoresultModel.findOneAndUpdate(
        { mid,gType },
        {
          cards: cards,
          win: `${win}`,
          desc: '',
        },
      );

      if (mid != 0) {
        if (!teen20ContainMid) {
          response = {
            cards: cards,
            desc: '',
            gtype: gType,
            sid: sid.join(','),
            mid: mid,
            win: `${win}`,
          };
          const teen20Response = new this.casinoresultModel(response);
          await teen20Response.save();
        }
      }

      // set result
      const teen20SetResult = await this.casinoresultModel.find({
        win: 'undefined',
      });

      let teen20DataMid, teen20ResultMid;
      for (let item of teen20SetResult) {
        teen20DataMid = item.mid;
        for (let wins of teen20WinData.data) {
          teen20ResultMid = wins.mid;
          if (teen20DataMid == teen20ResultMid) {
            win = wins.result;
          }

          await this.casinoresultModel.findOneAndUpdate(
            {
              mid: teen20DataMid,
              gtype: gType,
            },
            {
              win: `${win}`,
            },
          );
        }
      }

      this.logger.warn('Teen20 cron is running');
    } catch (error) {
      this.logger.error(error);
    }
  }
}
