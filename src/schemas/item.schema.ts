import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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
  ownerDeptId?: string;

  @Prop()
  serialNumber?: string;

  @Prop()
  note?: string;

  @Prop({ type: [String], default: [] })
  imageUrls: string[];
}

export const ItemSchema = SchemaFactory.createForClass(Item);
