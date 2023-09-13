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
    const poker20Url = 'http://185.180.223.49:9002/data/poker20';
    const poker20WinResultUrl = 'http://185.180.223.49:9002/result/poker20';
    try {
      const poker20ResData = await axios.get(poker20Url);
      const poker20WinResult = await axios.get(poker20WinResultUrl);

      let data = JSON.parse(poker20ResData.data.Data);
      let winData = JSON.parse(poker20WinResult.data.Data);

      let card, response, mid, gtype, desc;
      for (let item of data.t1) {
        desc = item.desc;
        mid = item.mid;
        gtype = item.gtype;
        card = `${item.C1},${item.C2},${item.C3},${item.C4},${item.C5},${item.C6},${item.C7},${item.C8},${item.C9}`;
      }

      let sid = [];
      let items = data.t2;
      let player1Sids = items.filter((index) => index % 2 == 0);
      let player2Sids = items.filter((index) => index % 2 == 1);

      desc = desc.replaceAll('#Pair,', '#One Pair,');
      //PLAYER 1 SID GET DATA
      let sidStrings = desc.split('##');
      if (sidStrings.length) {
        if (sidStrings[0] === 'Player A') {
          sid.push(items[0].sid);
          const nation = sidStrings[1].split(',')[0];
          const nation2 = sidStrings[2].split(',')[0];
          // console.log('nation 1 :-',nation);
          // console.log('nation 2 :-',nation2);
          sid.push(
            player1Sids.find((item, index) => item.nation == nation)?.sid,
          );
          sid.push(
            player2Sids.find((item, index) => item.nation == nation2)?.sid,
          );
        } else if (sidStrings[0] === 'Player B') {
          // console.log('hello :-',sidStrings[0])
          sid.push(items[0].sid);
          const nation = sidStrings[1].split(',')[0];
          const nation2 = sidStrings[2].split(',')[0];
          // console.log('nation :-', nation);
          // console.log('nation 2 :-', nation2);
          sid.push(
            player2Sids.find((item, index) => item.nation == nation)?.sid,
          );
          sid.push(
            player1Sids.find((item, index) => item.nation == nation2)?.sid,
          );
          // console.log('sid :',sid);
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
