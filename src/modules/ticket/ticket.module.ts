import { Module } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Ticket, TicketSchema } from 'src/schemas/ticket.schema';
import { UploadService } from 'src/services/upload.service';
import { AssetItemModule } from '../asset-item/asset-item.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Ticket.name, schema: TicketSchema }]),
    AssetItemModule,
  ],
  controllers: [TicketController],
  providers: [TicketService, UploadService],
})
export class TicketModule {}
