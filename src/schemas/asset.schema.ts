import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

export type AssetDocument = Asset & Document;

export enum AssetType {
  Device = 'Device',
  Appliance = 'Appliance',
  Furniture = 'Furniture',
  IT = 'IT',
  Facility = 'Facility',
}

@Schema({ timestamps: true })
export class Asset {
  @Prop({ required: true, unique: true })
  code: string; // CAM-HIK-2143

  @Prop({ required: true })
  name: string; // Hikvision DS-2CD2143

  @Prop({ required: true, enum: AssetType })
  type: AssetType;

  @Prop()
  vendor?: string;

  @Prop()
  model?: string;

  @Prop()
  purchaseUrl?: string;

  @Prop({ type: [String], default: [] })
  imageUrls: string[];

  @Prop({ type: Boolean, default: true })
  active: boolean;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'user' })
  created_by: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'user' })
  updated_by?: Types.ObjectId;
}

export const AssetSchema = SchemaFactory.createForClass(Asset);
