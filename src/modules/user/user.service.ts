import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { from, mergeMap, Observable, throwError } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/schemas/user.schema';
import { Model } from 'mongoose';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  create(createUserDto: CreateUserDto) {
    const created = new this.userModel(createUserDto);
    return from(created.save());
  }

  findAll() {
    return from(this.userModel.find().lean().exec());
  }

  findOne(id: string) {
    return from(this.userModel.findById(id).lean().exec());
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return from(this.userModel.findByIdAndUpdate(id, updateUserDto));
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
