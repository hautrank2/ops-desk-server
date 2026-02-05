import { UserRole } from 'src/schemas/user.schema';

export type JwtPayload = {
  userId: string;
  username: string;
  token: string;
  role: UserRole;
  iat: number;
  exp: number;
};
