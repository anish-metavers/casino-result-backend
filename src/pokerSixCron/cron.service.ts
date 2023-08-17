import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { CasinoResult, CasinoResultDocument } from 'model/t_casino_result';
import { Model } from 'mongoose';

@Injectable()
export class PokerSixService {
  private readonly logger = new Logger(PokerSixService.name);

  constructor(
    @InjectModel(CasinoResult.name)
    private casinoresultModel: Model<CasinoResultDocument>,
  ) {}

  @Cron('*/5 * * * * *')
  async handleCron() {
    const poker6DayUrl = 'http://185.180.223.49:9002/data/poker9';
    const poker6DayWinResultUrl = 'http://185.180.223.49:9002/result/poker9';
    try {
      const pokerResData = await axios.get(poker6DayUrl);
      const pokerWinResult = await axios.get(poker6DayWinResultUrl);

      let data = JSON.parse(pokerResData.data.Data);
      let winData = JSON.parse(pokerWinResult.data.Data);

      let card, response, mid, gtype, desc;
      for (let item of data.t1) {
        desc = item.desc;
        mid = item.mid;
        gtype = item.gtype;
        card = `${item.C1},${item.C2},${item.C3},${item.C4},${item.C5},${item.C6},${item.C7},${item.C8},${item.C9},${item.C10},${item.C11},${item.C12},${item.C13},${item.C14},${item.C15},${item.C16},${item.C17}`;
      }

      let sid = [];
      let items = data.t2;
      let sidStrings = desc?.split('||');

      if (sidStrings.length >= 2) {
        let nation = sidStrings[1].split(':')[1]?.trim();

        if (sidStrings.length) {
          if (sidStrings[0].includes('Player 1')) {
            sid.push(items[0].sid);
          } else if (sidStrings[0].includes('Player 2')) {
            sid.push(items[1].sid);
          } else if (sidStrings[0].includes('Player 3')) {
            sid.push(items[2].sid);
          } else if (sidStrings[0].includes('Player 4')) {
            sid.push(items[3].sid);
          } else if (sidStrings[0].includes('Player 5')) {
            sid.push(items[4].sid);
          } else if (sidStrings[0].includes('Player 6')) {
            sid.push(items[5].sid);
          }
          sid.push(items.find((item, index) => item.nation == nation)?.sid);
        }
      }

      let win;
      const containMid = await this.casinoresultModel.findOneAndUpdate(
        { mid, gtype },
        {
          cards: card,
          desc: `${desc}`,
          gtype: gtype,
          mid: mid,
          sid: sid.join(','),
          win: `${win}`,
        },
      );
      if (mid != 0) {
        if (!containMid) {
          response = {
            cards: card,
            desc: `${desc}`,
            gtype: gtype,
            sid: sid.join(','),
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
              win: `${win}`,
            },
          );
        }
      }
      this.logger.verbose('Poker9 cron is running');
    } catch (error) {
      console.log(error);
    }
  }
}
