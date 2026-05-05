import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TicketCommentDocument = TicketComment & Document;

@Schema({ timestamps: true })
export class TicketComment {
  @Prop({ type: Types.ObjectId, ref: 'Ticket', required: true, index: true })
  ticketId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ type: [String], default: [] })
  imgUrls: string[];

  // null means root comment (depth 0)
  @Prop({ type: Types.ObjectId, ref: 'TicketComment', default: null })
  parentId: Types.ObjectId | null;

  // Always points to depth-0 ancestor; null for root comments themselves
  @Prop({ type: Types.ObjectId, ref: 'TicketComment', default: null })
  rootId: Types.ObjectId | null;

  // 0 = root, 1 = reply to root, 2 = reply to reply (max depth)
  @Prop({ default: 0 })
  depth: number;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;
}

export const TicketCommentSchema = SchemaFactory.createForClass(TicketComment);
