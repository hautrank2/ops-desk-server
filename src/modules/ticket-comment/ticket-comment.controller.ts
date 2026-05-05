import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Delete,
  Query,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { JwtPayload } from 'src/types/auth';
import { CreateTicketCommentDto } from './dto/create-ticket-comment.dto';
import { TicketCommentQueryDto } from './dto/ticket-comment-query.dto';
import { UpdateTicketCommentDto } from './dto/update-ticket-comment.dto';
import { UpdateTicketCommentImagesDto } from './dto/update-ticket-comment-images.dto';
import { TicketCommentService } from './ticket-comment.service';
import { ApiConsumes } from '@nestjs/swagger';

@Controller('ticket-comment')
export class TicketCommentController {
  constructor(private readonly service: TicketCommentService) {}

  @Get()
  findAll(@Query() query: TicketCommentQueryDto) {
    return this.service.findAll(query.ticketId);
  }

  @Post()
  @UseInterceptors(FilesInterceptor('images', 5))
  create(
    @Body() dto: CreateTicketCommentDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
  ) {
    const { userId } = req['payload'] as JwtPayload;
    return this.service.create(dto, userId, files ?? []);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTicketCommentDto,
    @Req() req: Request,
  ) {
    const { userId } = req['payload'] as JwtPayload;
    return this.service.update(id, dto, userId);
  }

  // PUT :id/images — replace image set optimally
  // Body (multipart): keepUrls[] (existing public_ids to keep) + images (new files)
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @Put(':id/images')
  updateImages(
    @Param('id') id: string,
    @Body() dto: UpdateTicketCommentImagesDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
  ) {
    const { userId } = req['payload'] as JwtPayload;
    return this.service.updateImages(
      id,
      dto.keepUrls ?? [],
      files ?? [],
      userId,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const { userId } = req['payload'] as JwtPayload;
    return this.service.remove(id, userId);
  }
}

