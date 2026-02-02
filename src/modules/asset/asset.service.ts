import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { InjectModel } from '@nestjs/mongoose';
import { concat, from, map, Observable, of, switchMap, throwError } from 'rxjs';
import { UploadService } from 'src/services/upload.service';
import { CreateAssetItemDto } from './dto/create-asset-item.dto';
import { Asset } from 'src/schemas/asset.schema';
import { Item, ItemStatus } from 'src/schemas/item.schema';
import { generateSerialNumber } from 'src/utils/generate';
import { Model } from 'mongoose';

@Injectable()
export class AssetService {
  constructor(
    @InjectModel(Asset.name)
    private readonly assetModel: Model<Asset>,
    @InjectModel(Item.name)
    private readonly itemModel: Model<Item>,
    private readonly uploadSrv: UploadService,
  ) {}

  create(createAssetDto: CreateAssetDto, files?: Express.Multer.File[]) {
    const upload$ = files
      ? files.map(file => from(this.uploadSrv.uploadFile(file, ['asset'])))
      : of([]);

    return concat(upload$).pipe(
      switchMap(imageUrls => {
        return from(
          this.assetModel.findOne({ code: createAssetDto.code }),
        ).pipe(
          switchMap(existed => {
            if (existed) {
              return throwError(
                () => new ConflictException('Asset code already exists'),
              );
            }

            return from(
              new this.assetModel({
                ...createAssetDto,
                imageUrls,
              }).save(),
            );
          }),
        );
      }),
    );
  }

  private saveAsset(dto: CreateAssetDto, files?: Express.Multer.File[]) {
    const imageUrls = files?.map(f => `/uploads/assets/${f.filename}`) ?? [];

    return new this.assetModel({
      ...dto,
      imageUrls,
    }).save();
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
  update(id: string, updateAssetDto: UpdateAssetDto) {
    return from(
      this.assetModel.findByIdAndUpdate(id, updateAssetDto, { new: true }),
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
      this.assetModel.findByIdAndUpdate(
        id,
        { status: 'Retired' },
        { new: true },
      ),
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
}
