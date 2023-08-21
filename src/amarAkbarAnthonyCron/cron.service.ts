import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { Model } from 'mongoose';
import { CasinoResult, CasinoResultDocument } from 'model/t_diamond_casino_result';

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
export class amarAkbarAnthonyService {
  private readonly logger = new Logger(amarAkbarAnthonyService.name);

  constructor(
    @InjectModel(CasinoResult.name)
    private casinoresultModel: Model<CasinoResultDocument>,
  ) {}

  @Cron('*/5 * * * * *')
  async handleCron() {
    const aaaUrl = 'http://185.180.223.49:9002/data/aaa';
    const aaaWinResultUrl = 'http://185.180.223.49:9002/result/aaa';
    try {
      const resData = await axios.get(aaaUrl);
      const WinResult = await axios.get(aaaWinResultUrl);

      let data = JSON.parse(resData.data.Data);
      let winData = JSON.parse(WinResult.data.Data);

      let card, response, mid, gtype;
      for (let item of data.t1) {
        mid = item.mid;
        gtype = item.gtype;
        card = item.C1;
      }

      let cardRes, color, oddsEven, cardUnderOver, cardNumber, cardData;

      for (let i = 0; i < cardNumbers.length; i++) {
        if (cardNumbers[i] == card) {
          cardRes = cardNumbers[i];
          cardData = cardRes[0];

          for (let i = 0; i < cardType.length; i++) {
            if (cardRes[0] == cardType[i]) {
              cardNumber = cardType[i];

              if (cardNumber == 'A') {
                cardUnderOver = 'Under 7';
              } else if (cardNumber > '7' || cardNumber == '1') {
                cardUnderOver = 'Over 7';
              } else if (cardNumber == '7') {
                cardUnderOver = 'Tie';
              } else {
                cardUnderOver = 'Under 7';
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

      let win, winnerName;

      const containMid = await this.casinoresultModel.findOneAndUpdate(
        { mid, gtype },
        {
          cards: card,
          win: `${win}`,
          desc: `${color} | ${oddsEven} | ${cardUnderOver} | card ${
            cardData == 'A' ? 1 : cardData == '1' ? 10 : cardData
          }`,
          sid: `${
            cardUnderOver == 'Under 7'
              ? 1
              : cardUnderOver == 'Over 7'
              ? 2
              : cardUnderOver == 'Tie'
              ? 3
              : cardUnderOver
          }`,
        },
      );

      if (!containMid) {
        response = {
          cards: card,
          desc: `${color} | ${oddsEven} | ${cardUnderOver} | card ${
            cardData == 'A' ? 1 : cardData == '1' ? 10 : cardData
          }`,
          gtype: gtype,
          sid: `${
            cardUnderOver == 'Under 7'
              ? 1
              : cardUnderOver == 'Over 7'
              ? 2
              : cardUnderOver == 'Tie'
              ? 3
              : cardUnderOver
          }`,
          mid: mid,
          win: `${win}`,
        };

        const amarAkbar = new this.casinoresultModel(response);
        await amarAkbar.save();
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
            await this.casinoresultModel.findOneAndUpdate(
              { mid: dataMid, gtype },
              {
                win: `${win}`,
              },
            );
          }

          if (win == '1') {
            winnerName = 'Amar';
          } else if (win == '2') {
            winnerName = 'Akbar';
          } else if (win == '3') {
            winnerName = 'Anthony';
          }
        }
        if (winnerName) {
          const data = await this.casinoresultModel.findOne({ mid: dataMid });

          if (data)
            await this.casinoresultModel.updateOne(
              { mid: dataMid, gtype: gtype },
              { desc: `${winnerName} | ${data.desc}` },
            );
        }
      }
      this.logger.verbose('Amar akbar anthony cron is running');
    } catch (error) {
      console.error(error);
    }
  }
}
