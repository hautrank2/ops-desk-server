import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AssetDocument = Asset & Document;

export enum AssetType {
  Device = 'Device',
  Vehicle = 'Vehicle',
  Facility = 'Facility',
  Tool = 'Tool',
  IT = 'IT',
}

export enum AssetStatus {
  Active = 'Active',
  Faulty = 'Faulty',
  Maintenance = 'Maintenance',
  Retired = 'Retired',
}

@Schema({ timestamps: true })
export class Asset {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: AssetType })
  type: AssetType;

  @Prop()
  category?: string; // Camera, Printer, AC...

  @Prop({ enum: AssetStatus, default: AssetStatus.Active })
  status: AssetStatus;

  @Prop()
  locationId?: string;

  @Prop()
  ownerDeptId?: string;

  @Prop()
  serialNumber?: string;

  @Prop()
  model?: string;

  @Prop()
  vendor?: string;

  @Prop()
  installedAt?: Date;

  @Prop()
  warrantyExpiredAt?: Date;

  @Prop({ type: [String], default: [] })
  imageUrls?: string[];

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const AssetSchema = SchemaFactory.createForClass(Asset);
