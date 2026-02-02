import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { InjectModel } from '@nestjs/mongoose';
import { concat, from, map, of, switchMap, throwError } from 'rxjs';
import { Model } from 'mongoose';
import { Asset } from './entities/asset.entity';
import { UploadService } from 'src/services/upload.service';

@Injectable()
export class AssetService {
  constructor(
    @InjectModel(Asset.name)
    private readonly assetModel: Model<Asset>,
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
  findOne(id: string) {
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
}
