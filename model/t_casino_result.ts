import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CasinoResultDocument = HydratedDocument<CasinoResult>;

@Schema({
  timestamps: false,
  collection: 't_casino_result',
})
export class CasinoResult {
  @Prop()
  cards: string;

  @Prop()
  desc: string;

  @Prop()
  gtype: string;

  @Prop({ unique: true })
  mid: string;

  @Prop()
  sid: string;

  @Prop()
  win: string;
}

export const CasinoResultSchema = SchemaFactory.createForClass(CasinoResult);