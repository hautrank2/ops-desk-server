import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AssetItemQueryDto } from './dto/asset-item-query.dto';
import { UpdateAssetItemDto } from './dto/update-asset-item.dto';
import { Item, ItemDocument } from 'src/schemas/item.schema';

@Injectable()
export class AssetItemService {
  constructor(
    @InjectModel(Item.name)
    private readonly itemModel: Model<ItemDocument>,
  ) {}

  async findAll(query: AssetItemQueryDto) {
    const {
      page = 1,
      pageSize = 10,
      code,
      serialNumber,
      locationId,
      assetId,
      status,
    } = query;

    const pageNumber = Number(page) > 0 ? Number(page) : 1;
    const limitNumber = Number(pageSize) > 0 ? Number(pageSize) : 10;
    const skip = (pageNumber - 1) * limitNumber;

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
      filter.assetId = assetId;
    }

    if (status) {
      filter.status = status;
    }

    const [items, total] = await Promise.all([
      this.itemModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      this.itemModel.countDocuments(filter),
    ]);

    return {
      items,
      page: pageNumber,
      pageSize: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    };
  }

  async findOne(id: string) {
    this.validateObjectId(id);

    const item = await this.itemModel.findById(id).lean();

    if (!item) {
      throw new NotFoundException('Asset item not found');
    }

    return item;
  }

  async update(id: string, updateAssetItemDto: UpdateAssetItemDto) {
    this.validateObjectId(id);

    const updated = await this.itemModel
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
      .lean();

    if (!updated) {
      throw new NotFoundException('Asset item not found');
    }

    return updated;
  }

  private validateObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid id');
    }
  }
}
