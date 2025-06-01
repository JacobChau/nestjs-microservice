import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventDocument = Event & Document;

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  venue: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  totalSeats: number;

  @Prop({ required: true })
  availableSeats: number;

  @Prop({ required: true })
  price: number;

  @Prop()
  description?: string;

  @Prop({ required: true })
  category: string;

  @Prop({ 
    required: true, 
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  })
  status: string;
}

export const EventSchema = SchemaFactory.createForClass(Event); 