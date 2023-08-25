import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import {
  CasinoResult,
  CasinoResultDocument,
} from 'model/t_diamond_casino_result';
import { Model } from 'mongoose';
import axios from 'axios';

@Injectable()
export class DragonTigerService {
  private readonly logger = new Logger(DragonTigerService.name);

  constructor(
    @InjectModel(CasinoResult.name)
    private casinoresultModel: Model<CasinoResultDocument>,
  ) {}

  @Cron('*/5 * * * * *')
  async handleCron() {
    const dragonTigerUrl = 'http://185.180.223.49:9002/data/dt20';
    const dragonTigerWinResultUrl = 'http://185.180.223.49:9002/result/dt20';
    try {
      const resData = await axios.get(dragonTigerUrl);
      const WinResult = await axios.get(dragonTigerWinResultUrl);

      let data = JSON.parse(resData.data.Data);
      let winData = JSON.parse(WinResult.data.Data);

      let cards, C1, C2, mid, gtype, cardCompair;
      for (let item of data.t1) {
        mid = item.mid;
        gtype = item.gtype;
        cards = `${item.C1},${item.C2}`;
        C1 = `${item.C1}`;
        C2 = `${item.C2}`;
      }

      // console.log('Card1 :', C1);
      // console.log('Card2 :', C2);
      // Card compair
      if (C1.charAt(0) == C2.charAt(0)) {
        cardCompair = 'Pair';
      } else if (C1 != C2) {
        cardCompair = 'No Pair';
      }

      // Find Odd Or Even Card First
      let oddEvenCardFirst;
      if (
        Number(C1.charAt(0)) % 2 == 0 ||
        C1.charAt(0) == 'Q' ||
        Number(C1.charAt(0)) == 1
      ) {
        oddEvenCardFirst = 'Even';
        // console.log('First card :', oddEvenCardFirst);
      } else {
        oddEvenCardFirst = 'Odd';
        // console.log('First card :', oddEvenCardFirst);
      }

      // Find Odd Or Even Card Second
      let oddEvenCardSecond;
      if (
        Number(C2.charAt(0) % 2) == 0 ||
        C2.charAt(0) == 'Q' ||
        Number(C2.charAt(0)) == 1
      ) {
        oddEvenCardSecond = 'Even';
        // console.log('Second card :', oddEvenCardSecond);
      } else {
        oddEvenCardSecond = 'Odd';
        // console.log('Second card :', oddEvenCardSecond);
      }

      // Check Colors Card First
      let win, response, winnerName, color1, color2;
      if (C1.includes('CC') || C1.includes('SS')) {
        color1 = 'Black';
        // console.log('color1 :', color1);
      } else if (C1.includes('HH') || C1.includes('DD')) {
        color1 = 'Red';
        // console.log('color1 :', color1);
      }

      // Check Color Card Second
      if (C2.includes('CC') || C2.includes('SS')) {
        color2 = 'Black';
        // console.log('color2 :', color2);
      } else if (C2.includes('HH') || C2.includes('DD')) {
        color2 = 'Red';
        // console.log('color2 :', color2);
      }

      const containMid = await this.casinoresultModel.findOneAndUpdate(
        { mid, gtype },
        {
          cards: cards,
          win: `${win}`,
          desc: `${cardCompair}*${color1}|${oddEvenCardFirst}|Card ${C1.charAt(
            0,
          )}*${color2}|${oddEvenCardSecond}|Card ${C2.charAt(0)}`,
        },
      );

      if (mid != 0) {
        if (!containMid) {
          response = {
            cards: cards,
            desc: `${cardCompair}*${color1}|${oddEvenCardFirst}|Card ${C1.charAt(
              0,
            )}*${color2}|${oddEvenCardSecond}|Card ${C2.charAt(0)}`,
            gtype: gtype,
            sid: '',
            mid: mid,
            win: `${win}`,
          };

          const DragonTigerResponse = new this.casinoresultModel(response);
          await DragonTigerResponse.save();
        }
      }

      //result set
      const DragonTigerSetResult = await this.casinoresultModel.find({
        win: 'undefined',
      });

      let dataMid, resultMid;
      for (let item of DragonTigerSetResult) {
        dataMid = item.mid;
        for (let wins of winData.data) {
          resultMid = wins.mid;
          if (resultMid == dataMid) {
            win = wins.result;
          }
          await this.casinoresultModel.findOneAndUpdate(
            { mid: dataMid, win: 'undefined', gtype },
            {
              win: `${win}`,
            },
          );
          if (win == 1) {
            winnerName = 'Dragon';
          } else if (win == 2) {
            winnerName = 'Tiger';
          } else if (win == 3) {
            winnerName = 'Tie';
          }
        }
        if (winnerName) {
          const data = await this.casinoresultModel.findOne({
            mid: dataMid,
            gtype: gtype,
          });
          if (data)
            await this.casinoresultModel.updateOne(
              { mid: dataMid, gtype: gtype },
              { desc: `${winnerName}|${data.desc}` },
            );
        }
      }

      this.logger.debug('Dragon tiger cron is running');
    } catch (error) {
      console.log(error);
    }
  }
}
