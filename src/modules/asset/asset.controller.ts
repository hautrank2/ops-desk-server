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
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { AssetService } from './asset.service';
import { CreateAssetDto, CreateAssetFormDataDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateAssetItemDto } from './dto/create-asset-item.dto';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { AssetGuard } from './asset.guard';

@Controller('asset')
@UseGuards(AssetGuard)
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Asset data',
    type: CreateAssetFormDataDto,
  })
  @UseInterceptors(FilesInterceptor('images', 2))
  @Post()
  create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() createAssetDto: CreateAssetDto,
    @Req() request: Request,
  ) {
    if (!request.payload) {
      throw new ForbiddenException('Invalid Authorization');
    }
    return this.assetService.create(
      createAssetDto,
      request.payload.userId,
      files,
    );
  }

  @Get()
  findAll() {
    return this.assetService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assetService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAssetDto: UpdateAssetDto) {
    return this.assetService.update(id, updateAssetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assetService.remove(id);
  }

  @Post(':id/items')
  createItems(@Param('id') id: string, @Body() dto: CreateAssetItemDto) {
    return this.assetService.createItems(id, dto);
  }
}
