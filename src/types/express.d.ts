import { JwtPayload } from './auth';

declare global {
  interface Request {
    payload?: JwtPayload;
  }
}
