import { User, UserRole, UserStatus } from 'src/schemas/user.schema';

export type UserDto = User;

export type UserQueryModel = {
  email?: string;
  username?: string;
  name?: string;
  role?: UserRole;
  status?: UserStatus;
};
