import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TicketLogDocument = TicketLog & Document;

@Schema({ timestamps: true })
export class TicketLog {
  @Prop({ required: true })
  ticketId: string;

  @Prop({ required: true })
  action: string; // CREATED, ASSIGNED, DONE...

  @Prop()
  note?: string;

  @Prop({ required: true })
  createdBy: string;
}

export const TicketLogSchema = SchemaFactory.createForClass(TicketLog);
