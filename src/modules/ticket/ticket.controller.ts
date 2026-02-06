import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  Req,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import {
  CreateTicketDto,
  CreateTicketFromDataDto,
} from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { TicketQueryDto } from './dto/ticket-query.dto';

@Controller('ticket')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Asset data',
    type: CreateTicketFromDataDto,
  })
  @UseInterceptors(FilesInterceptor('images', 2))
  @Post()
  create(
    @Body() createTicketDto: CreateTicketDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() request: Request,
  ) {
    if (!request.payload) {
      throw new ForbiddenException('Invalid Authorization');
    }
    return this.ticketService.create(
      createTicketDto,
      request.payload.userId,
      files,
    );
  }

  @Get()
  findAll(@Query() query: TicketQueryDto) {
    return this.ticketService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto) {
    return this.ticketService.update(+id, updateTicketDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketService.remove(+id);
  }
}
