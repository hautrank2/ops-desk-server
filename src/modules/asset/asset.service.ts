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
  findAll() {
    return from(
      this.assetModel
        .find({ status: { $ne: 'Retired' } })
        .sort({ createdAt: -1 })
        .lean(),
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
  createItems(id: string, dto: CreateAssetItemDto) {
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
