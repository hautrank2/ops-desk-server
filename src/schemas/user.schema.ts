import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'blocked';
export enum UserRoleEnum {
  Admin = 'admin',
  User = 'user',
}
@Schema({ timestamps: true })
export class User {
  @Prop({
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    index: true,
  })
  email!: string;

  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  // 1 role đủ dùng cho MVP
  @Prop({
    required: true,
    enum: ['admin', 'user'],
    index: true,
  })
  role!: UserRole;

  // Policy scope (optional)
  @Prop({ type: Types.ObjectId, ref: 'Department', index: true })
  deptId?: Types.ObjectId;

  @Prop({ default: 'active', enum: ['active', 'blocked'], index: true })
  status!: UserStatus;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ deptId: 1, role: 1 });
UserSchema.index({ siteId: 1, role: 1 });
