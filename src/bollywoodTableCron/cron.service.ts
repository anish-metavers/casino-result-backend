import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import {
  CasinoResult,
  CasinoResultDocument,
} from 'model/t_diamond_casino_result';
import { Model } from 'mongoose';

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
export class BollywoodTableService {
  private readonly logger = new Logger(BollywoodTableService.name);

  constructor(
    @InjectModel(CasinoResult.name)
    private casinoresultModel: Model<CasinoResultDocument>,
  ) {}

  @Cron('*/5 * * * * *')
  async handleCron() {
    const bTableUrl = 'http://43.205.157.72:3434/casino/btDataBig';
    const bTableWinResultUrl = 'http://185.180.223.49:9002/result/btable';
    try {
      const resData = await axios.get(bTableUrl);
      const WinResult = await axios.get(bTableWinResultUrl);

      let data = resData.data.data.data.t1[0];
      let gtype = resData.data.data.data.t2[0].gtype;

      let card = data.C1;
      let mid = data.mid;
      let response;

      let winData = JSON.parse(WinResult.data.Data);

      let cardRes, color, oddsEven, cardHighLow, cardNumber, cardData;
      for (let i = 0; i < cardNumbers.length; i++) {
        if (cardNumbers[i] == card) {
          cardRes = cardNumbers[i];
          cardData = cardRes[0];

          for (let i = 0; i < cardType.length; i++) {
            if (cardRes[0] == cardType[i]) {
              cardNumber = cardType[i];

              if (cardNumber == 'A' || cardNumber == 'J') {
                cardHighLow = 'BARATI';
              } else if (cardNumber == 'K' || cardNumber == 'Q') {
                cardHighLow = 'DULHA DULHAN';
              }
            }
          }

          if (cardRes.includes('CC') || cardRes.includes('SS')) {
            color = 'BLACK';
          } else {
            color = 'RED';
          }

          if (!Number(cardRes[0])) {
            if (cardRes.includes('Q')) {
              oddsEven = 'EVEN';
            } else {
              if (
                cardRes.includes('J') ||
                cardRes.includes('K') ||
                cardRes.includes('A')
              ) {
                oddsEven = 'ODD';
              }
            }
          } else {
            if (cardRes[0] % 2 == 0) {
              oddsEven = 'EVEN';
            } else if (cardRes.length == 4) {
              oddsEven = 'EVEN';
            } else {
              oddsEven = 'ODD';
            }
          }
        }
      }

      let win, winnerName;

      const containMid = await this.casinoresultModel.findOneAndUpdate(
        { mid, gtype },
        {
          cards: card,
          win: `${win}`,
          desc: `${color} | ${oddsEven} | ${cardHighLow} | CARD ${
            cardData == 'A' ? 1 : cardData == '1' ? 10 : cardData
          }`,
        },
      );

      if (mid != 0) {
        if (!containMid) {
          response = {
            cards: card,
            desc: `${color} | ${oddsEven} | ${cardHighLow} | CARD ${
              cardData == 'A' ? 1 : cardData == '1' ? 10 : cardData
            }`,
            nat: ``,
            gtype: gtype,
            sid: '',
            mid: mid,
            win: `${win}`,
          };
          const bTableResponse = new this.casinoresultModel(response);
          await bTableResponse.save();
        }
      }

      //result set
      const setResult = await this.casinoresultModel.find({
        gtype: gtype,
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
            { mid: dataMid, gtype },
            {
              win: `${win}`,
            },
          );
          if (win == '1') {
            winnerName = 'DON';
          } else if (win == '2') {
            winnerName = 'AMAR AKBAR ANTHONY';
          } else if (win == '3') {
            winnerName = 'SAHIB BIBI AUR GHULAM';
          } else if (win == '4') {
            winnerName = 'DHARAM VEER';
          } else if (win == '5') {
            winnerName = 'KIS KISKO PYAAR KAROON';
          } else if (win == '6') {
            winnerName = 'GHULAM';
          }
        }
        if (winnerName) {
          const data = await this.casinoresultModel.findOne({
            mid: dataMid,
            gtype: gtype,
          });

          if (countString(data.desc, '|') < 4) {
            if (data)
              await this.casinoresultModel.updateOne(
                { mid: dataMid, gtype },
                {
                  desc: `${winnerName} | ${data.desc}`,
                  nat: `${winnerName} | ${data.desc} - ${gtype}`,
                },
              );
          }
        }
      }

      this.logger.log('Bollywood table cron is running');
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
