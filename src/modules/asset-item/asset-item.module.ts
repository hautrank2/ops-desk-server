import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AssetItemService } from './asset-item.service';
import { AssetItemController } from './asset-item.controller';
import { Item, ItemSchema } from 'src/schemas/item.schema';
import { Asset, AssetSchema } from 'src/schemas/asset.schema';
import { Location, LocationSchema } from 'src/schemas/location.schema';
import { User, UserSchema } from 'src/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Item.name, schema: ItemSchema },
      { name: Asset.name, schema: AssetSchema },
      { name: Location.name, schema: LocationSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AssetItemController],
  providers: [AssetItemService],
  exports: [AssetItemService],
})
export class AssetItemModule {}
