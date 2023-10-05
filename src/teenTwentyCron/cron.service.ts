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
export class TeenTwentyService {
  private readonly logger = new Logger(TeenTwentyService.name);

  constructor(
    @InjectModel(CasinoResult.name)
    private casinoresultModel: Model<CasinoResultDocument>,
  ) {}

  @Cron('*/5 * * * * *')
  async handleCron() {
    const teen20DataUrl = 'http://43.205.157.72:3434/casino/tp20DataBig';
    const teen20WinResultUrl = 'http://185.180.223.49:9002/result/teen20';
    try {
      const resData = await axios.get(teen20DataUrl);
      const WinResult = await axios.get(teen20WinResultUrl);

      let data = resData.data.data.data.t1[0];

      let cards = `${data.C1},${data.C4},${data.C2},${data.C5},${data.C3},${data.C6}`;
      let win, response;
      let gType = data.gtype;

      let teen20WinData = JSON.parse(WinResult.data.Data);

      let sid = [];
      let mid;

      let items = resData.data.data.data.t2;
      items.forEach((item) => {
        sid.push(item.sid);
        mid = item.mid;
      });

      const teen20ContainMid = await this.casinoresultModel.findOneAndUpdate(
        { mid, gtype: gType },
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
            nat: `${gType}`,
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
        gtype: gType,
      });

      let teen20DataMid, teen20ResultMid;
      for (let item of teen20SetResult) {
        teen20DataMid = item.mid;
        for (let wins of teen20WinData.data) {
          teen20ResultMid = wins.mid;
          if (teen20DataMid == teen20ResultMid) {
            win = wins.result;
            await this.casinoresultModel.findOneAndUpdate(
              {
                mid: teen20DataMid,
                gtype: gType,
              },
              {
                nat: `${win == 3 ? 'Player B' : 'Player A'} - ${gType}`,
                win: `${win}`,
              },
            );
          }
        }
      }

      this.logger.debug('Teen20 cron is running');
    } catch (error) {
      this.logger.error(error);
    }
  }
}
