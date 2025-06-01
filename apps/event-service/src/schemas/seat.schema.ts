import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SeatDocument = Seat & Document;

@Schema({ timestamps: true })
export class Seat {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  eventId: string;

  @Prop({ required: true })
  row: string;

  @Prop({ required: true })
  number: number;

  @Prop({ 
    required: true, 
    enum: ['available', 'reserved', 'booked'],
    default: 'available'
  })
  status: string;

  @Prop({ required: true })
  price: number;

  @Prop({ 
    required: true, 
    enum: ['regular', 'vip', 'premium'],
    default: 'regular'
  })
  type: string;

  @Prop()
  reservedUntil?: Date;

  @Prop()
  reservedBy?: string;
}

export const SeatSchema = SchemaFactory.createForClass(Seat); 