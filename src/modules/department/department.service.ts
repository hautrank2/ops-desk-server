import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { from, throwError } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Department } from 'src/schemas/department.schema';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectModel(Department.name)
    private readonly departmentModel: Model<Department>,
  ) {}

  // CREATE
  create(createDepartmentDto: CreateDepartmentDto) {
    return from(
      this.departmentModel.findOne({ code: createDepartmentDto.code }),
    ).pipe(
      switchMap(existed => {
        if (existed) {
          return throwError(
            () => new ConflictException('Department code already exists'),
          );
        }

        return from(new this.departmentModel(createDepartmentDto).save());
      }),
    );
  }

  // READ ALL
  findAll() {
    return from(
      this.departmentModel
        .find({ isActive: true })
        .sort({ createdAt: -1 })
        .lean(),
    );
  }

  // READ ONE
  findOne(id: string) {
    return from(this.departmentModel.findById(id).lean()).pipe(
      map(department => {
        if (!department) {
          throw new NotFoundException('Department not found');
        }
        return department;
      }),
    );
  }

  // UPDATE
  update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
    return from(
      this.departmentModel.findByIdAndUpdate(id, updateDepartmentDto, {
        new: true,
      }),
    ).pipe(
      map(department => {
        if (!department) {
          throw new NotFoundException('Department not found');
        }
        return department;
      }),
    );
  }

  // DELETE (soft delete)
  remove(id: string) {
    return from(
      this.departmentModel.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true },
      ),
    ).pipe(
      map(department => {
        if (!department) {
          throw new NotFoundException('Department not found');
        }

        return {
          message: 'Department removed successfully',
        };
      }),
    );
  }
}
