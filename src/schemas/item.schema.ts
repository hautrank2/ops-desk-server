import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { User } from './user.schema';

export type ItemDocument = Item & Document;

export enum ItemStatus {
  Active = 'Active',
  Faulty = 'Faulty',
  Maintenance = 'Maintenance',
  Retired = 'Retired',
}

@Schema({ timestamps: true })
export class Item {
  @Prop({ required: true })
  assetId: string;

  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ enum: ItemStatus, default: ItemStatus.Active })
  status: ItemStatus;

  @Prop()
  locationId?: string;

  @Prop()
  owerId?: string;

  @Prop()
  serialNumber?: string;

  @Prop()
  note?: string;

  @Prop({ type: [String], default: [] })
  imageUrls: string[];

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
  })
  createdBy: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name, default: null })
  updatedBy?: Types.ObjectId;
}

export const ItemSchema = SchemaFactory.createForClass(Item);
