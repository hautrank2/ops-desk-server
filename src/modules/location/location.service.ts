import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { from, map, of, switchMap, throwError } from 'rxjs';
import {
  FloorType,
  Location,
  LocationDocument,
} from 'src/schemas/location.schema';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationQueryDto } from './dto/location-query.dto';

@Injectable()
export class LocationService {
  constructor(
    @InjectModel(Location.name)
    private readonly locationModel: Model<LocationDocument>,
  ) {}

  create(dto: CreateLocationDto) {
    return from(this.locationModel.findOne({ code: dto.code }).lean()).pipe(
      switchMap(existing => {
        if (existing) {
          return throwError(
            () => new ConflictException('Location code already exists'),
          );
        }

        return from(this.locationModel.create(dto)).pipe(
          switchMap(created =>
            from(this.locationModel.findById(created._id).lean()),
          ),
        );
      }),
    );
  }

  findAll(query: LocationQueryDto) {
    const { page, pageSize, code, name, floor, isActive } = query;

    const filter: Record<string, any> = {};

    if (code) {
      filter.code = { $regex: code, $options: 'i' };
    }

    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }

    if (floor !== undefined && floor !== null) {
      filter.floor = floor;
    }

    if (typeof isActive === 'boolean') {
      filter.isActive = isActive;
    }

    const hasPagination =
      page !== undefined &&
      page !== null &&
      pageSize !== undefined &&
      pageSize !== null;

    if (!hasPagination) {
      return from(
        this.locationModel.find(filter).sort({ createdAt: -1 }).lean().exec(),
      ).pipe(
        map(items => ({
          items,
          total: items.length,
        })),
      );
    }

    const pageNumber = Number(page) > 0 ? Number(page) : 1;
    const limitNumber = Number(pageSize) > 0 ? Number(pageSize) : 10;
    const skip = (pageNumber - 1) * limitNumber;

    return from(
      Promise.all([
        this.locationModel
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNumber)
          .lean(),
        this.locationModel.countDocuments(filter),
      ]),
    ).pipe(
      map(([items, total]) => ({
        items,
        page: pageNumber,
        pageSize: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      })),
    );
  }

  getFloors() {
    return from(
      this.locationModel
        .distinct('floor', {
          floor: { $ne: null },
        })
        .lean()
        .exec(),
    ).pipe(
      map(floors => {
        const floorOrder: FloorType[] = ['B2', 'B1', 0, 1, 2, 3];

        const sortedFloors = floors.sort(
          (a: FloorType, b: FloorType) =>
            floorOrder.indexOf(a) - floorOrder.indexOf(b),
        );

        return {
          items: sortedFloors,
        };
      }),
    );
  }

  findOne(id: string) {
    return this.validateObjectId(id).pipe(
      switchMap(() => from(this.locationModel.findById(id).lean())),
      switchMap(location => {
        if (!location) {
          return throwError(() => new NotFoundException('Location not found'));
        }

        return of(location);
      }),
    );
  }

  update(id: string, dto: UpdateLocationDto) {
    return this.validateObjectId(id).pipe(
      switchMap(() => {
        if (!dto.code) {
          return of(null);
        }

        return from(
          this.locationModel
            .findOne({
              code: dto.code,
              _id: { $ne: id },
            })
            .lean(),
        );
      }),
      switchMap(existing => {
        if (existing) {
          return throwError(
            () => new ConflictException('Location code already exists'),
          );
        }

        return from(
          this.locationModel
            .findByIdAndUpdate(
              id,
              {
                ...dto,
                updatedAt: new Date(),
              },
              {
                new: true,
                runValidators: true,
              },
            )
            .lean(),
        );
      }),
      switchMap(updated => {
        if (!updated) {
          return throwError(() => new NotFoundException('Location not found'));
        }

        return of(updated);
      }),
    );
  }

  remove(id: string) {
    return this.validateObjectId(id).pipe(
      switchMap(() => from(this.locationModel.findByIdAndDelete(id).lean())),
      switchMap(deleted => {
        if (!deleted) {
          return throwError(() => new NotFoundException('Location not found'));
        }

        return of({
          message: 'Location deleted successfully',
        });
      }),
    );
  }

  private validateObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      return throwError(() => new BadRequestException('Invalid id'));
    }

    return of(true);
  }
}
