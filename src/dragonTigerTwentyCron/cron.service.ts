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
export class dragonTigerTwentyService {
  private readonly logger = new Logger(dragonTigerTwentyService.name);

  constructor(
    @InjectModel(CasinoResult.name)
    private casinoresultModel: Model<CasinoResultDocument>,
  ) {}

  @Cron('*/5 * * * * *')
  async handleCron() {
    const dragonTiger20Url = 'http://43.205.157.72:3434/casino/dt20DataBig';
    const dragonTiger20WinResultUrl = 'http://185.180.223.49:9002/result/dt20';
    try {
      const resData = await axios.get(dragonTiger20Url);
      const WinResult = await axios.get(dragonTiger20WinResultUrl);

      let data = resData.data.data.data.t1[0];
      let mid = data.mid;
      let gtype = data.gtype;
      let C1 = data.C1;
      let C2 = data.C2;
      let cards = `${data.C1},${data.C2}`;
      let cardCompair;

      // let data = JSON.parse(resData.data.Data);
      let winData = JSON.parse(WinResult.data.Data);

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
      } else {
        oddEvenCardFirst = 'Odd';
      }

      // Find Odd Or Even Card Second
      let oddEvenCardSecond;
      if (
        Number(C2.charAt(0) % 2) == 0 ||
        C2.charAt(0) == 'Q' ||
        Number(C2.charAt(0)) == 1
      ) {
        oddEvenCardSecond = 'Even';
      } else {
        oddEvenCardSecond = 'Odd';
      }

      // Check Colors Card First
      let win, response, winnerName, color1, color2;
      if (C1.includes('CC') || C1.includes('SS')) {
        color1 = 'Black';
      } else if (C1.includes('HH') || C1.includes('DD')) {
        color1 = 'Red';
      }

      // Check Color Card Second
      if (C2.includes('CC') || C2.includes('SS')) {
        color2 = 'Black';
      } else if (C2.includes('HH') || C2.includes('DD')) {
        color2 = 'Red';
      }

      const containMid = await this.casinoresultModel.findOneAndUpdate(
        { mid, gtype },
        {
          cards: cards,
          win: `${win}`,
          desc: `${cardCompair}*${color1}|${oddEvenCardFirst}|Card ${C1.replace(
            /[^0-9AaJjKkQq]/gi,
            '',
          )}*${color2}|${oddEvenCardSecond}|Card ${C2.replace(
            /[^0-9AaJjKkQq]/gi,
            '',
          )}`,
        },
      );

      if (mid != 0) {
        if (!containMid) {
          response = {
            cards: cards,
            desc: `${cardCompair}*${color1}|${oddEvenCardFirst}|Card ${C1.replace(
              /[^0-9AaJjKkQq]/gi,
              '',
            )}*${color2}|${oddEvenCardSecond}|Card ${C2.replace(
              /[^0-9AaJjKkQq]/gi,
              '',
            )}`,
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
        gtype,
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
          if (countString(data.desc, '|') < 5) {
            if (data)
              await this.casinoresultModel.updateOne(
                { mid: dataMid, gtype: gtype },
                { desc: `${winnerName}|${data.desc}` },
              );
          }
        }
      }

      this.logger.verbose('Dragon tiger 20 cron is running');
    } catch (error) {
      console.log(error);
    }
  }
}

function countString(str, letter) {
  let count = 0;
  // looping through the items
  for (let i = 0; i < str.length; i++) {
    // check if the character is at that position
    if (str.charAt(i) == letter) {
      count += 1;
    }
  }
  return count;
}
