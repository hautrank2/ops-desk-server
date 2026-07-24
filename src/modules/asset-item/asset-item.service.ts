import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { from, map, of, switchMap, throwError } from 'rxjs';
import { AssetItemQueryDto } from './dto/asset-item-query.dto';
import { UpdateAssetItemDto } from './dto/update-asset-item.dto';
import { Item, ItemDocument } from 'src/schemas/item.schema';

@Injectable()
export class AssetItemService {
  constructor(
    @InjectModel(Item.name)
    private readonly itemModel: Model<ItemDocument>,
  ) {}

  findAll(query: AssetItemQueryDto) {
    const {
      page,
      pageSize,
      include = [],
      code,
      serialNumber,
      locationId,
      assetId,
      status,
    } = query;

    const filter: Record<string, any> = {};

    if (code) {
      filter.code = { $regex: code, $options: 'i' };
    }

    if (serialNumber) {
      filter.serialNumber = { $regex: serialNumber, $options: 'i' };
    }

    if (locationId) {
      filter.locationId = locationId;
    }

    if (assetId) {
      filter.assetId = new Types.ObjectId(assetId);
    }

    if (status) {
      filter.status = status;
    }

    const hasPagination =
      page !== undefined &&
      page !== null &&
      pageSize !== undefined &&
      pageSize !== null;

    const populates = this.buildPopulate(include);

    if (!hasPagination) {
      let mongooseQuery = this.itemModel.find(filter).sort({ createdAt: -1 });

      for (const populate of populates) {
        mongooseQuery = mongooseQuery.populate(populate);
      }

      return from(mongooseQuery.lean().exec()).pipe(
        map(items => ({
          items,
          total: items.length,
        })),
      );
    }

    const pageNumber = Number(page) > 0 ? Number(page) : 1;
    const limitNumber = Number(pageSize) > 0 ? Number(pageSize) : 10;
    const skip = (pageNumber - 1) * limitNumber;

    let mongooseQuery = this.itemModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    for (const populate of populates) {
      mongooseQuery = mongooseQuery.populate(populate);
    }

    return from(
      Promise.all([
        mongooseQuery.lean(),
        this.itemModel.countDocuments(filter),
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

  findByIds(ids: string[]) {
    return this.itemModel.find({ _id: { $in: ids } }).lean();
  }

  findOne(id: string, include: string[] = []) {
    return this.validateObjectId(id).pipe(
      switchMap(() => {
        let mongooseQuery = this.itemModel.findById(id);

        for (const populate of this.buildPopulate(include)) {
          mongooseQuery = mongooseQuery.populate(populate);
        }

        return from(mongooseQuery.lean());
      }),
      switchMap(item => {
        if (!item) {
          return throwError(
            () => new NotFoundException('Asset item not found'),
          );
        }

        return of(item);
      }),
    );
  }

  update(id: string, updateAssetItemDto: UpdateAssetItemDto) {
    return this.validateObjectId(id).pipe(
      switchMap(() =>
        from(
          this.itemModel
            .findByIdAndUpdate(
              id,
              {
                ...updateAssetItemDto,
                updatedAt: new Date(),
              },
              {
                new: true,
                runValidators: true,
              },
            )
            .lean(),
        ),
      ),
      switchMap(updated => {
        if (!updated) {
          return throwError(
            () => new NotFoundException('Asset item not found'),
          );
        }

        return of(updated);
      }),
    );
  }

  private validateObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      return throwError(() => new BadRequestException('Invalid id'));
    }

    return of(true);
  }

  private buildPopulate(include: string[] = []) {
    const includeSet = new Set(include);
    const populates: any[] = [];

    if (includeSet.has('createdBy')) {
      populates.push({
        path: 'createdBy',
        select: '_id username email name role status',
      });
    }

    if (includeSet.has('updatedBy')) {
      populates.push({
        path: 'updatedBy',
        select: '_id username email name role status',
      });
    }

    return populates;
  }
}
