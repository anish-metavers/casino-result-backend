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
    const dragonTigerUrl = 'http://43.205.157.72:3434/casino/1daydtDataBig';
    const dragonTigerWinResultUrl = 'http://185.180.223.49:9002/result/dt6';
    try {
      const resData = await axios.get(dragonTigerUrl);
      const WinResult = await axios.get(dragonTigerWinResultUrl);

      let data = resData.data.data.data.t1[0];
      let gtype = resData.data.data.data.t2[0].gtype;

      let mid = data.mid;
      let C1 = data.C1;
      let C2 = data.C2;
      let cards = `${data.C1},${data.C2}`;
      let cardCompair;

      let winData = JSON.parse(WinResult.data.Data);

      // Card compair pair or not pair
      if (C1.charAt(0) == C2.charAt(0)) {
        cardCompair = 'Pair';
      } else if (C1 != C2) {
        cardCompair = 'No Pair';
      }

      // Find the odd or even card first
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

      // Find the odd or even card second
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

      // Check the first card color

      let firstCardColorName;
      if (C1.includes('CC')) {
        firstCardColorName = 'Club';
      } else if (C1.includes('SS')) {
        firstCardColorName = 'Spade';
      } else if (C1.includes('HH')) {
        firstCardColorName = 'Heart';
      } else if (C1.includes('DD')) {
        firstCardColorName = 'Diamond';
      }

      let firstCardColor;
      if (C1.includes('CC') || C1.includes('SS')) {
        firstCardColor = 'Black';
      } else if (C1.includes('HH') || C1.includes('DD')) {
        firstCardColor = 'Red';
      }

      // Check the second card color
      let secondCardColorName;
      if (C2.includes('CC')) {
        secondCardColorName = 'Club';
      } else if (C2.includes('SS')) {
        secondCardColorName = 'Spade';
      } else if (C2.includes('HH')) {
        secondCardColorName = 'Heart';
      } else if (C2.includes('DD')) {
        secondCardColorName = 'Diamond';
      }

      let secondCardColor;
      if (C2.includes('CC') || C2.includes('SS')) {
        secondCardColor = 'Black';
      } else if (C2.includes('HH') || C2.includes('DD')) {
        secondCardColor = 'Red';
      }

      let win, response;
      const containMid = await this.casinoresultModel.findOneAndUpdate(
        { mid, gtype },
        {
          cards: cards,
          win: `${win}`,
          desc: `${cardCompair}*${firstCardColor}|${oddEvenCardFirst}|${firstCardColorName}*${secondCardColor}|${oddEvenCardSecond}|${secondCardColorName}`,
        },
      );

      if (mid != 0) {
        if (!containMid) {
          response = {
            cards: cards,
            desc: '',
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

      let dataMid, resultMid, winnerName;
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

      this.logger.verbose('Dragon tiger cron is running');
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
