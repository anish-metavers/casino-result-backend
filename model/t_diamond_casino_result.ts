import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CasinoResultDocument = HydratedDocument<CasinoResult>;

@Schema({
  timestamps: false,
  collection: 't_diamond_casino_result',
})
export class CasinoResult {
  @Prop()
  cards: string;

  @Prop()
  desc: string;

  @Prop()
  gtype: string;

  @Prop()
  mid: string;

  @Prop()
  sid: string;

  @Prop()
  win: string;
}

const CasinoResultSchema = SchemaFactory.createForClass(CasinoResult);
CasinoResultSchema.index({ gtype: 1, mid: 1 }, { unique: true });
export { CasinoResultSchema };
