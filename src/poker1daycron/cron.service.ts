import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { CasinoResult, CasinoResultDocument } from 'model/t_casino_result';
import { Model } from 'mongoose';

@Injectable()
export class PokerService {
  private readonly logger = new Logger(PokerService.name);

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

      let sid = [];
      let items = data.t2;
      let player1Sids = items.filter((item, index) => index % 2 == 0);
      let player2Sids = items.filter((item, index) => index % 2 == 1);

      // desc = desc.replace('#Pair,', '#One Pair,');
      let sidStrings = desc.split('##');
      // console.log(sidStrings[0], sidStrings[1], sidStrings[2]);
      if (sidStrings.length) {
        if (sidStrings[0] == 'Player A') {
          sid.push(items[0].sid);
          // console.log('item :', items[0]);
          const nation = sidStrings[1].split(',')[0];
          const nation2 = sidStrings[2].split(',')[0];
          sid.push(
            player1Sids.find((item, index) => item.nation == nation)?.sid,
          );
          sid.push(
            player2Sids.find((item, index) => item.nation == nation2)?.sid,
          );
        } else if (sidStrings[0] == 'Player B') {
          sid.push(items[0].sid);
          const nation = sidStrings[1].split(',')[0];
          const nation2 = sidStrings[2].split(',')[0];
          sid.push(
            player2Sids.find((item, index) => item.nation == nation)?.sid,
          );
          sid.push(
            player1Sids.find((item, index) => item.nation == nation2)?.sid,
          );
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
      this.logger.debug('Poker 1 day cron is running');
    } catch (error) {
      console.log(error);
    }
  }
}
