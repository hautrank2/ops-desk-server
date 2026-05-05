import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TicketComment,
  TicketCommentSchema,
} from 'src/schemas/ticket-comment.schema';
import { UploadService } from 'src/services/upload.service';
import { TicketCommentController } from './ticket-comment.controller';
import { TicketCommentService } from './ticket-comment.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TicketComment.name, schema: TicketCommentSchema },
    ]),
  ],
  controllers: [TicketCommentController],
  providers: [TicketCommentService, UploadService],
})
export class TicketCommentModule {}
