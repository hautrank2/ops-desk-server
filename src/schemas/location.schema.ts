import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LocationDocument = Location & Document;

export type FloorType = 'B2' | 'B1' | 0 | 1 | 2 | 3;

@Schema({ timestamps: true })
export class Location {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: String, default: null })
  floor?: FloorType | null;

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const LocationSchema = SchemaFactory.createForClass(Location);
