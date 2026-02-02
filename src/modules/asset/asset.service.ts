import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { InjectModel } from '@nestjs/mongoose';
import { from, map, switchMap, throwError } from 'rxjs';
import { Model } from 'mongoose';
import { Asset } from './entities/asset.entity';

@Injectable()
export class AssetService {
  constructor(
    @InjectModel(Asset.name)
    private readonly assetModel: Model<Asset>,
  ) {}

  // CREATE
  create(createAssetDto: CreateAssetDto) {
    return from(this.assetModel.findOne({ code: createAssetDto.code })).pipe(
      switchMap(existed => {
        if (existed) {
          return throwError(
            () => new ConflictException('Asset code already exists'),
          );
        }
        return from(new this.assetModel(createAssetDto).save());
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
