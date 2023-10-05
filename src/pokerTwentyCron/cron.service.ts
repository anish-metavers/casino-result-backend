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
export class PokerTwentyService {
  private readonly logger = new Logger(PokerTwentyService.name);

  constructor(
    @InjectModel(CasinoResult.name)
    private casinoresultModel: Model<CasinoResultDocument>,
  ) {}

  @Cron('*/5 * * * * *')
  async handleCron() {
    // const poker20Url = 'http://185.180.223.49:9002/data/poker20';
    const dataUrl = 'http://43.205.157.72:3434/casino/2020pDataBig';
    const ResultUrl = 'http://185.18.223.49:9002/result/poker20';
    try {
      const responseData = await axios.get(dataUrl);
      const resultData = await axios.get(ResultUrl);

      // console.log(responseData.data.data.data);

      let data = JSON.parse(responseData.data.Data);
      let winData = JSON.parse(resultData.data.Data);

      let card, response, mid, gtype, desc;
      for (let item of data.t1) {
        desc = item.desc;
        mid = item.mid;
        gtype = item.gtype;
        card = `${item.C1},${item.C2},${item.C3},${item.C4},${item.C5},${item.C6},${item.C7},${item.C8},${item.C9}`;
      }

      let sid = [];
      desc = desc.replaceAll('#Pair,', '#One Pair,');
      let winResult = desc.split('#')?.[0];
      let playerAres = desc.split('#')?.[2];
      let playerBres = desc.split('#')?.[4];
      console.log('desc :', desc);
      console.log('player :', winResult);
      console.log('playerAres :', playerAres);
      console.log('playerBres :', playerBres);

      if (winResult == 'Player A') {
        sid.push(11);
        if (playerAres.includes('One Pair')) {
          sid.push(12);
        } else if (playerAres.includes('Two Pair')) {
          sid.push(13);
        } else if (playerAres.includes('Three of a Kind')) {
          sid.push(14);
        } else if (playerAres.includes('Straight')) {
          sid.push(15);
        } else if (playerAres.includes('Flush')) {
          sid.push(16);
        } else if (playerAres.includes('Full House')) {
          sid.push(17);
        } else if (playerAres.includes('Four of a Kind')) {
          sid.push(18);
        } else if (playerAres.includes('Straight Flush')) {
          sid.push(19);
        }
      }

      if (winResult == 'Player B') {
        sid.push(21);
        if (playerBres.includes('One Pair')) {
          sid.push(22);
        } else if (playerBres.includes('Two Pair')) {
          sid.push(23);
        } else if (playerBres.includes('Three of a Kind')) {
          sid.push(24);
        } else if (playerBres.includes('Straight')) {
          sid.push(25);
        } else if (playerBres.includes('Flush')) {
          sid.push(26);
        } else if (playerBres.includes('Full House')) {
          sid.push(27);
        } else if (playerBres.includes('Four of a Kind')) {
          sid.push(28);
        } else if (playerBres.includes('Straight Flush')) {
          sid.push(29);
        }
      }

      if (playerBres == 'Player B') {
        if (playerBres.includes('One Pair')) {
          sid.push(22);
        } else if (playerBres.includes('Two Pair')) {
          sid.push(23);
        } else if (playerBres.includes('Three of a Kind')) {
          sid.push(24);
        } else if (playerBres.includes('Straight')) {
          sid.push(25);
        } else if (playerBres.includes('Flush')) {
          sid.push(26);
        } else if (playerBres.includes('Full House')) {
          sid.push(27);
        } else if (playerBres.includes('Four of a Kind')) {
          sid.push(28);
        } else if (playerBres.includes('Straight Flush')) {
          sid.push(29);
        }
      }

      let win;
      const containMid = await this.casinoresultModel.findOneAndUpdate(
        { mid, gtype },
        {
          cards: card,
          desc: `${desc}`,
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
              win: `${win}`,
            },
          );
        }
      }

      this.logger.debug('Poker20 cron is running');
    } catch (error) {
      console.log(error);
    }
  }
}
