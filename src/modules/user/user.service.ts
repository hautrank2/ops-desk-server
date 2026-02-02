import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  catchError,
  from,
  mergeMap,
  Observable,
  switchMap,
  throwError,
} from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserQueryModel } from './dto/user.dto';
import { escapeRegex } from 'src/utils/query';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  create(createUserDto: CreateUserDto) {
    const saltOrRounds = 10;
    const { password, ...restDto } = createUserDto;

    const email = restDto.email?.trim().toLowerCase();
    const username = restDto.username?.trim().toLowerCase();

    return from(
      this.userModel
        .findOne({ $or: [{ email }, { username }] })
        .select('_id email username')
        .lean()
        .exec(),
    ).pipe(
      switchMap(found => {
        if (found?.email === email) {
          return throwError(
            () => new ConflictException('Email already exists'),
          );
        }
        if (found?.username === username) {
          return throwError(
            () => new ConflictException('Username already exists'),
          );
        }
        return from(bcrypt.hash(password, saltOrRounds));
      }),
      switchMap(passwordHash => {
        const created = new this.userModel({
          ...restDto,
          email,
          username,
          passwordHash,
        });

        return from(created.save()).pipe(
          catchError((err: any) => {
            if (err?.code === 11000) {
              const dupField = Object.keys(
                err.keyPattern ?? err.keyValue ?? {},
              )[0];
              if (dupField === 'email') {
                return throwError(
                  () => new ConflictException('Email already exists'),
                );
              }
              if (dupField === 'username') {
                return throwError(
                  () => new ConflictException('Username already exists'),
                );
              }
              return throwError(() => new ConflictException('Duplicate value'));
            }
            return throwError(() => err);
          }),
        );
      }),
    );
  }

  findAll(filter?: UserQueryModel) {
    const q: any = {};

    if (filter?.email?.trim()) {
      q.email = { $regex: escapeRegex(filter.email.trim()), $options: 'i' };
    }

    if (filter?.username?.trim()) {
      q.username = {
        $regex: escapeRegex(filter.username.trim()),
        $options: 'i',
      };
    }

    if (filter?.name?.trim()) {
      q.name = { $regex: escapeRegex(filter.name.trim()), $options: 'i' };
    }

    if (filter?.role) q.role = filter.role;

    if (filter?.status !== undefined && filter?.status !== null) {
      q.status = filter.status;
    }

    return from(this.userModel.find(q).lean().exec());
  }

  findOne(id: string) {
    return from(this.userModel.findById(id).lean().exec());
  }

  findOneByFilter(
    filter?: UserQueryModel,
    opts?: { includePasswordHash?: boolean },
  ) {
    const q: any = {};

    if (filter?.email?.trim()) {
      q.email = { $regex: escapeRegex(filter.email.trim()), $options: 'i' };
    }
    if (filter?.username?.trim()) {
      q.username = {
        $regex: escapeRegex(filter.username.trim()),
        $options: 'i',
      };
    }
    if (filter?.name?.trim()) {
      q.name = { $regex: escapeRegex(filter.name.trim()), $options: 'i' };
    }

    if (filter?.role) q.role = filter.role;
    if (filter?.status !== undefined && filter?.status !== null)
      q.status = filter.status;

    const query = this.userModel.findOne(q);

    if (opts?.includePasswordHash) {
      query.select('+passwordHash');
    }

    return from(query.lean().exec());
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return from(
      this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }),
    );
  }

  remove(id: string): Observable<User> {
    return from(this.userModel.findByIdAndDelete(id).exec()).pipe(
      mergeMap(doc => {
        if (!doc) {
          return throwError(() => new NotFoundException('User not found'));
        }
        // trả về user vừa bị xoá
        return from([doc.toObject() as User]);
      }),
    );
  }
}
