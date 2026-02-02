import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AssetDocument = Asset & Document;

export enum AssetType {
  Device = 'Device', // camera, printer, coffee machine...
  Furniture = 'Furniture', // desk, chair, cabinet
  Appliance = 'Appliance', // refrigerator, microwave...
  IT = 'IT', // server, network
  Vehicle = 'Vehicle',
  Facility = 'Facility',
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

  @Prop({ type: [String], default: [] })
  imageUrls: string[];
}

export const AssetSchema = SchemaFactory.createForClass(Asset);
