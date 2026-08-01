import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  defer,
  forkJoin,
  from,
  map,
  Observable,
  of,
  switchMap,
  throwError,
} from 'rxjs';
import { UploadService } from 'src/services/upload.service';
import { CreateAssetItemDto } from './dto/create-asset-item.dto';
import { Asset } from 'src/schemas/asset.schema';
import { Item, ItemStatus } from 'src/schemas/item.schema';
import { generateSerialNumber } from 'src/utils/generate';
import { Model, Types } from 'mongoose';
import { AssetQueryDto } from './dto/asset-query.dto';

type AssetItemCount = {
  _id: string;
  total: number;
  Active: number;
  Faulty: number;
  Maintenance: number;
  Retired: number;
};

@Injectable()
export class AssetService {
  constructor(
    @InjectModel(Asset.name)
    private readonly assetModel: Model<Asset>,
    @InjectModel(Item.name)
    private readonly itemModel: Model<Item>,
    private readonly uploadSrv: UploadService,
  ) {}

  create(
    createAssetDto: CreateAssetDto,
    userId: string,
    files?: Express.Multer.File[],
  ) {
    return from(this.assetModel.findOne({ code: createAssetDto.code })).pipe(
      switchMap(existed => {
        console.log('existed', existed);
        if (existed) {
          return throwError(
            () => new ConflictException('Asset code already exists'),
          );
        }

        const upload$ = files
          ? forkJoin(
              files.map(file =>
                defer(() => this.uploadSrv.uploadFile(file, ['asset'])),
              ),
            )
          : of([]);

        return upload$.pipe(
          switchMap(imageUrls => {
            return from(
              new this.assetModel({
                ...createAssetDto,
                imageUrls,
                createdBy: new Types.ObjectId(userId),
              }).save(),
            );
          }),
        );
      }),
    );
  }

  // READ ALL
  findAll(filters: AssetQueryDto): Observable<any> {
    const {
      code,
      name,
      type,
      vendor,
      model,
      active,
      createdBy,
      page,
      pageSize,
      sortBy = 'createdAt',
      order = 'desc',
      populations: populationsFilter = [],
      itemCount = false,
    } = filters;

    const filter: Record<string, any> = {};

    if (code) filter.code = { $regex: code, $options: 'i' };
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (vendor) filter.vendor = { $regex: vendor, $options: 'i' };
    if (model) filter.model = { $regex: model, $options: 'i' };
    if (type) filter.type = type;
    if (typeof active === 'boolean') filter.active = active;
    if (createdBy) filter.createdBy = createdBy;

    const allowedSort = new Set([
      'createdAt',
      'updatedAt',
      'code',
      'name',
      'type',
      'active',
    ]);
    const safeSortBy = allowedSort.has(sortBy) ? sortBy : 'createdAt';
    const sort = { [safeSortBy]: order === 'asc' ? 1 : -1 } as Record<
      string,
      1 | -1
    >;

    const populations = this.buildPopulate(populationsFilter);

    const hasPagination =
      page !== undefined &&
      page !== null &&
      pageSize !== undefined &&
      pageSize !== null;

    if (!hasPagination) {
      let query = this.assetModel.find(filter).sort(sort);
      if (populations.length) query = query.populate(populations);

      return from(query.lean().exec()).pipe(
        switchMap((items: any[]) => {
          const total$ = from(this.assetModel.countDocuments(filter));

          // FIX: lấy _id từ items đã query, chỉ count những asset này
          const itemCount$ = itemCount
            ? this.getItemCountStats$(items.map(i => i._id))
            : of([] as AssetItemCount[]);

          return forkJoin([total$, itemCount$]).pipe(
            map(([total, itemCountStats]) => ({
              total,
              items: itemCount
                ? this.attachItemCount(items, itemCountStats)
                : items,
            })),
          );
        }),
      );
    }

    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.max(1, Math.min(200, Number(pageSize) || 20));
    const skip = (safePage - 1) * safePageSize;

    let query = this.assetModel
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(safePageSize);
    if (populations.length) query = query.populate(populations);

    return forkJoin([
      from(this.assetModel.countDocuments(filter)),
      from(query.lean().exec()),
    ]).pipe(
      switchMap(([total, items]: [number, any[]]) => {
        const itemCount$: Observable<AssetItemCount[]> = itemCount
          ? this.getItemCountStats$(items.map(i => i._id))
          : of<AssetItemCount[]>([]);

        return itemCount$.pipe(
          map(itemCountStats => ({
            total,
            totalPage: Math.ceil(total / safePageSize),
            page: safePage,
            pageSize: safePageSize,
            items: itemCount
              ? this.attachItemCount(items, itemCountStats)
              : items,
          })),
        );
      }),
    );
  }

  // READ ONE
  findOne(id: string): Observable<Asset> {
    return from(this.assetModel.findById(id).lean()).pipe(
      map(asset => {
        if (!asset) {
          throw new NotFoundException('Asset not found');
        }
        return asset;
      }),
    );
  }

  // UPDATE
  update(id: string, updateAssetDto: UpdateAssetDto, userId: string) {
    return from(
      this.assetModel.findByIdAndUpdate(
        id,
        { ...updateAssetDto, updatedBy: new Types.ObjectId(userId) },
        { new: true },
      ),
    ).pipe(
      map(asset => {
        if (!asset) {
          throw new NotFoundException('Asset not found');
        }
        return asset;
      }),
    );
  }

  // DELETE (soft delete → Retired)
  remove(id: string) {
    return from(
      this.assetModel.findByIdAndUpdate(id, { active: false }, { new: true }),
    ).pipe(
      map(asset => {
        if (!asset) {
          throw new NotFoundException('Asset not found');
        }
        return { message: 'Asset retired successfully' };
      }),
    );
  }

  // Create items
  createItems(id: string, dto: CreateAssetItemDto, userId: string) {
    return from(this.findOne(id)).pipe(
      switchMap(async asset => {
        if (!asset) {
          throw new NotFoundException('Asset not found');
        }

        const assetObjectId = new Types.ObjectId(id); // convert 1 lần

        const count = await this.itemModel.countDocuments({
          assetId: assetObjectId,
        });
        const items = Array.from({ length: dto.quantity }).map((_, i) => ({
          assetId: assetObjectId, // lưu ObjectId
          code: `${asset.code}-${String(count + i + 1).padStart(3, '0')}`,
          status: ItemStatus.Active,
          locationId: dto.locationId,
          ownerDeptId: dto.ownerDeptId,
          serialNumber: dto.serialNumber ?? generateSerialNumber(asset.code),
          note: dto.note,
          createdBy: new Types.ObjectId(userId),
          updatedBy: null,
        }));

        return this.itemModel.insertMany(items);
      }),
    );
  }

  addImages(id: string, imgs: Express.Multer.File[], userId: string) {
    return from(this.assetModel.findById(id)).pipe(
      switchMap(asset => {
        if (!asset) {
          return throwError(() => new NotFoundException('Asset not found'));
        }
        const upload$ = imgs
          ? forkJoin(
              imgs.map(file =>
                defer(() => this.uploadSrv.uploadFile(file, ['asset'])),
              ),
            )
          : of([]);

        return upload$.pipe(
          switchMap(imgUrls => {
            asset.imageUrls.push(...imgUrls);
            asset.updatedBy = new Types.ObjectId(userId);
            return from(asset.save());
          }),
        );
      }),
    );
  }

  removeImages(id: string, index: number, userId: string) {
    return from(this.assetModel.findById(id)).pipe(
      switchMap(asset => {
        if (!asset) {
          return throwError(() => new NotFoundException('Asset not found'));
        }

        if (index < 0 || index >= asset.imageUrls.length) {
          return throwError(
            () => new BadRequestException('Invalid image index'),
          );
        }

        const removedImgUrl = asset.imageUrls[index];

        return this.uploadSrv.removeFile(removedImgUrl).pipe(
          switchMap(() => {
            asset.imageUrls.splice(index, 1);
            asset.updatedBy = new Types.ObjectId(userId);
            return from(asset.save());
          }),
        );
      }),
    );
  }

  private getItemCountStats$(assetIds: any[]): Observable<AssetItemCount[]> {
    const objectIds = assetIds.map(id => new Types.ObjectId(String(id)));

    return from(
      this.itemModel
        .aggregate<AssetItemCount>([
          {
            $match: { assetId: { $in: objectIds } },
          },
          {
            $group: {
              _id: '$assetId',
              total: { $sum: 1 },
              Active: {
                $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] },
              },
              Faulty: {
                $sum: { $cond: [{ $eq: ['$status', 'Faulty'] }, 1, 0] },
              },
              Maintenance: {
                $sum: { $cond: [{ $eq: ['$status', 'Maintenance'] }, 1, 0] },
              },
              Retired: {
                $sum: { $cond: [{ $eq: ['$status', 'Retired'] }, 1, 0] },
              },
            },
          },
          {
            $project: {
              _id: { $toString: '$_id' }, // convert về string để attachItemCount map đúng
              total: 1,
              Active: 1,
              Faulty: 1,
              Maintenance: 1,
              Retired: 1,
            },
          },
        ])
        .exec(),
    );
  }

  // attachItemCount giữ nguyên — Map đã O(1), không cần loop thêm
  private attachItemCount<T extends { _id: any }>(
    items: T[],
    itemCountStats: AssetItemCount[],
  ): (T & { itemCount: AssetItemCount })[] {
    const statsMap = new Map<string, AssetItemCount>(
      itemCountStats.map(stat => [stat._id, stat]),
    );

    return items.map(item => {
      const stat = statsMap.get(String(item._id));
      return {
        ...item,
        itemCount: {
          _id: String(item._id),
          total: stat?.total ?? 0,
          Active: stat?.Active ?? 0,
          Faulty: stat?.Faulty ?? 0,
          Maintenance: stat?.Maintenance ?? 0,
          Retired: stat?.Retired ?? 0,
        },
      };
    });
  }

  private buildPopulate(include: string[] = []) {
    const includeSet = new Set(include);
    const populations: any[] = [];

    if (includeSet.has('createdBy')) {
      populations.push({
        path: 'createdBy',
        select: '_id username email name role status',
      });
    }

    if (includeSet.has('updatedBy')) {
      populations.push({
        path: 'updatedBy',
        select: '_id username email name role status',
      });
    }

    return populations;
  }
}
