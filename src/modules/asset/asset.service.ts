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
import { TableResponse } from 'src/types/response';

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
  findAll(query: AssetQueryDto): Observable<TableResponse<Asset>> {
    const {
      code,
      name,
      type,
      vendor,
      model,
      active,
      createdBy,
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      order = 'desc',
    } = query;

    const filter: Record<string, any> = {};

    // text search (partial, case-insensitive)
    if (code) filter.code = { $regex: code, $options: 'i' };
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (vendor) filter.vendor = { $regex: vendor, $options: 'i' };
    if (model) filter.model = { $regex: model, $options: 'i' };

    // enums
    if (type) filter.type = type;

    // boolean
    if (typeof active === 'boolean') filter.active = active;

    // ids
    if (createdBy) filter.createdBy = createdBy;

    // pagination
    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.max(1, Math.min(200, Number(pageSize) || 20));
    const skip = (safePage - 1) * safePageSize;

    // sorting (whitelist)
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

    const count$ = from(this.assetModel.countDocuments(filter));
    const data$ = from(
      this.assetModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(safePageSize)
        .lean()
        .exec(),
    );

    return forkJoin([count$, data$]).pipe(
      map(([total, items]) => ({
        total,
        totalPage: Math.ceil(total / safePageSize),
        items,
        page: safePage,
        pageSize: safePageSize,
      })),
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

        const count = await this.itemModel.countDocuments({ assetId: id });
        const items = Array.from({ length: dto.quantity }).map((_, i) => {
          return {
            assetId: id,
            code: `${asset.code}-${String(count + i + 1).padStart(3, '0')}`,
            status: ItemStatus.Active,
            locationId: dto.locationId,
            ownerDeptId: dto.ownerDeptId,
            serialNumber: dto.serialNumber ?? generateSerialNumber(asset.code),
            note: dto.note,
            createdBy: new Types.ObjectId(userId),
            updatedBy: null,
          };
        });

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
}
