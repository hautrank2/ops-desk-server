import { UserRole } from 'src/schemas/user.schema';

export type JwtPayload = {
  token: string;
  username: string;
  role: UserRole;
};
