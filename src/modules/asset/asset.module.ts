import { Module } from '@nestjs/common';
import { AssetService } from './asset.service';
import { AssetController } from './asset.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Asset, AssetSchema } from 'src/schemas/asset.schema';
import { UploadService } from 'src/services/upload.service';
import { Item, ItemSchema } from 'src/schemas/item.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Asset.name, schema: AssetSchema },
      { name: Item.name, schema: ItemSchema },
    ]),
  ],
  controllers: [AssetController],
  providers: [AssetService, UploadService],
})
export class AssetModule {}
