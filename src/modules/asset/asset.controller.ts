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
} from '@nestjs/common';
import { AssetService } from './asset.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateAssetItemDto } from './dto/create-asset-item.dto';

@Controller('asset')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Post()
  @UseInterceptors(FileInterceptor('images'))
  create(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() createAssetDto: CreateAssetDto,
  ) {
    return this.assetService.create(createAssetDto, files);
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
