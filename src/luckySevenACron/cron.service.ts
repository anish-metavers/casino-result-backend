import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { Model } from 'mongoose';
import {
  CasinoResult,
  CasinoResultDocument,
} from 'model/t_diamond_casino_result';

const cardType = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '1',
  'J',
  'Q',
  'K',
];

const cardNumbers = [
  'ASS',
  '2SS',
  '3SS',
  '4SS',
  '5SS',
  '6SS',
  '7SS',
  '8SS',
  '9SS',
  '10SS',
  'JSS',
  'QSS',
  'KSS',
  'ADD',
  '2DD',
  '3DD',
  '4DD',
  '5DD',
  '6DD',
  '7DD',
  '8DD',
  '9DD',
  '10DD',
  'JDD',
  'QDD',
  'KDD',
  'AHH',
  '2HH',
  '3HH',
  '4HH',
  '5HH',
  '6HH',
  '7HH',
  '8HH',
  '9HH',
  '10HH',
  'JHH',
  'QHH',
  'KHH',
  'ACC',
  '2CC',
  '3CC',
  '4CC',
  '5CC',
  '6CC',
  '7CC',
  '8CC',
  '9CC',
  '10CC',
  'JCC',
  'QCC',
  'KCC',
];
@Injectable()
export class lucky7aService {
  private readonly logger = new Logger(lucky7aService.name);

  constructor(
    @InjectModel(CasinoResult.name)
    private casinoresultModel: Model<CasinoResultDocument>,
  ) {}

  @Cron('*/5 * * * * *')
  async handleCron() {
    const lucky7aUrl = 'http://43.205.157.72:3434/casino/lucky7aDataBig';
    const lucky7aResultUrl = 'http://185.180.223.49:9002/result/lucky7';
    try {
      const lucky7aResData = await axios.get(lucky7aUrl);
      const lucky7aResult = await axios.get(lucky7aResultUrl);

      let data = lucky7aResData.data.data.data.t1[0];

      let mid = data.mid;
      let card = data.C1;
      let gtype = data.gtype;
      let response;

      // let data = JSON.parse(lucky7ResData.data.Data);
      let winData = JSON.parse(lucky7aResult.data.Data);

      let cardData, cardHighLow, oddsEven, cardRes, color, cardNumber, win;

      for (let i = 0; i < cardNumbers.length; i++) {
        if (cardNumbers[i] == card) {
          cardRes = cardNumbers[i];
          cardData = cardRes[0];

          for (let i = 0; i < cardType.length; i++) {
            if (cardRes[0] == cardType[i]) {
              cardNumber = cardType[i];

              if (cardNumber == 'A') {
                cardHighLow = 'Low card';
              } else if (cardNumber > '7' || cardNumber == '1') {
                cardHighLow = 'High card';
              } else if (cardNumber == '7') {
                cardHighLow = 'Tie';
              } else {
                cardHighLow = 'Low card';
              }
            }
          }

          if (cardRes.includes('CC') || cardRes.includes('SS')) {
            color = 'Black';
          } else {
            color = 'Red';
          }

          if (!Number(cardRes[0])) {
            if (cardRes.includes('Q')) {
              oddsEven = 'Even';
            } else {
              if (
                cardRes.includes('J') ||
                cardRes.includes('K') ||
                cardRes.includes('A')
              ) {
                oddsEven = 'Odds';
              }
            }
          } else {
            if (cardRes[0] % 2 == 0) {
              oddsEven = 'Even';
            } else if (cardRes.length == 4) {
              oddsEven = 'Even';
            } else {
              oddsEven = 'Odds';
            }
          }
        }
      }
      response = {
        cards: card,
        win: `${win}`,
        desc: `${cardHighLow} | ${color} | ${oddsEven} | card ${
          cardData == '1' ? 10 : cardData
        }`,
        nat: `${cardHighLow} | ${color} | ${oddsEven} | card ${
          cardData == '1' ? 10 : cardData
        } - ${gtype}`,
        sid: `${
          cardHighLow == 'Low card'
            ? 1
            : cardHighLow == 'High card'
            ? 2
            : cardHighLow == 'Tie'
            ? 3
            : cardHighLow
        }`,
      };
      const containMid = await this.casinoresultModel.findOneAndUpdate(
        { mid, gtype },
        response,
      );

      if (mid != 0) {
        if (!containMid) {
          response = {
            cards: card,
            desc: `${cardHighLow} | ${color} | ${oddsEven} | card ${
              cardData == '1' ? 10 : cardData
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

      this.logger.warn('Lucky 7 a cron is running');
    } catch (error) {
      console.error(error);
    }
  }
}
