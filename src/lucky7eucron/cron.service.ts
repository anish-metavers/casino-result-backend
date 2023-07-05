import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { CasinoResult, CasinoResultDocument } from 'model/t_casino_result';
import { Model } from 'mongoose';

@Injectable()
export class Lucky7euService {
  private readonly logger = new Logger(Lucky7euService.name);

  constructor(
    @InjectModel(CasinoResult.name)
    private casinoresultModel: Model<CasinoResultDocument>,
  ) {}

  @Cron('*/5 * * * * *')
  async handleCron() {
    const lucky7Url = 'http://185.180.223.49:9002/Data/lucky7eu';
    const lucky7WinResultUrl = 'http://185.180.223.49:9002/result/lucky7eu';

    try {
      const lucky7ResData = await axios.get(lucky7Url);
      const lucky7WinResult = await axios.get(lucky7WinResultUrl);

      let data = JSON.parse(lucky7ResData.data.Data);
      let winData = JSON.parse(lucky7WinResult.data.Data);

      let card, response, mid, gtype;
      for (let item of data.t1) {
        mid = item.mid;
        gtype = item.gtype;
        card = item.C1;
      }

      let cardRes, color, oddsEven, cardHighLow, cardNumber, cardData;

      // for (let i = 0; i < cardNumbers.length; i++) {
      //   if (cardNumbers[i] == card) {
      //     cardRes = cardNumbers[i];
      //     // console.log(cardRes);
      //     cardData = cardRes[0];

      //     for (let i = 0; i < cardType.length; i++) {
      //       if (cardRes[0] == cardType[i]) {
      //         cardNumber = cardType[i];

      //         if (cardNumber == 'A') {
      //           cardHighLow = 'Low card';
      //           // console.log(cardHighLow);
      //         } else if (cardNumber > '7' || cardNumber == '1') {
      //           cardHighLow = 'High card';
      //           // console.log('High card');
      //         } else if (cardNumber == '7') {
      //           cardHighLow = 'Tie';
      //           // console.log('Tie');
      //         } else {
      //           cardHighLow = 'Low card';
      //           // console.log('Low card');
      //         }
      //       }
      //     }

      //     if (cardRes.includes('CC') || cardRes.includes('SS')) {
      //       color = 'Black';
      //       // console.log('Black');
      //     } else {
      //       color = 'Red';
      //       // console.log('Red');
      //     }

      //     if (!Number(cardRes[0])) {
      //       if (cardRes.includes('Q')) {
      //         oddsEven = 'Even';
      //         // console.log('Even');
      //       } else {
      //         if (
      //           cardRes.includes('J') ||
      //           cardRes.includes('K') ||
      //           cardRes.includes('A')
      //         ) {
      //           oddsEven = 'Odds';
      //           // console.log('Odds');
      //         }
      //       }
      //     } else {
      //       if (cardRes[0] % 2 == 0) {
      //         oddsEven = 'Even';
      //         // console.log('Even');
      //       } else if (cardRes.length == 4) {
      //         oddsEven = 'Even';
      //         // console.log('Even');
      //       } else {
      //         oddsEven = 'Odds';
      //         // console.log('Odds');
      //       }
      //     }
      //   }
      // }

      let win;

      const containMid = await this.casinoresultModel.findOneAndUpdate(
        { mid },
        {
          cards: card,
          win: `${win}`,
          desc: `${color} | ${oddsEven} | ${cardHighLow} | card ${
            cardData == 'A' ? 1 : cardData == '1' ? 10 : cardData
          }`,
          sid: `${
            cardHighLow == 'Low card'
              ? 1
              : cardHighLow == 'High card'
              ? 2
              : cardHighLow == 'Tie'
              ? 3
              : cardHighLow
          }`,
        },
      );

      if (!containMid) {
        response = {
          cards: card,
          desc: `${color} | ${oddsEven} | ${cardHighLow} | card ${
            cardData == 'A' ? 1 : cardData == '1' ? 10 : cardData
          }`,
          gtype: gtype,
          sid: `${
            cardHighLow == 'Low card'
              ? 1
              : cardHighLow == 'High card'
              ? 2
              : cardHighLow == 'Tie'
              ? 3
              : cardHighLow
          }`,
          mid: mid,
          win: `${win}`,
        };

        const lucky7Response = new this.casinoresultModel(response);
        await lucky7Response.save();
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
              win: `${cardHighLow == 'Tie' ? 3 : win}`,
              // win: `${win}`,
            },
          );
        }
      }

      this.logger.debug('Lucky7eu cron is running');
    } catch (error) {
      console.error(error);
    }
  }
}
