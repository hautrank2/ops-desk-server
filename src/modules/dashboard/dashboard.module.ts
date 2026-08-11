import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Asset, AssetSchema } from 'src/schemas/asset.schema';
import { Item, ItemSchema } from 'src/schemas/item.schema';
import { Location, LocationSchema } from 'src/schemas/location.schema';
import { Ticket, TicketSchema } from 'src/schemas/ticket.schema';
import { User, UserSchema } from 'src/schemas/user.schema';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Asset.name, schema: AssetSchema },
      { name: Item.name, schema: ItemSchema },
      { name: Ticket.name, schema: TicketSchema },
      { name: Location.name, schema: LocationSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
