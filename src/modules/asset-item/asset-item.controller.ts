import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { AssetItemService } from './asset-item.service';
import { AssetItemQueryDto } from './dto/asset-item-query.dto';
import { UpdateAssetItemDto } from './dto/update-asset-item.dto';
import { QueryInclude } from 'src/types/query';

@Controller('asset-item')
export class AssetItemController {
  constructor(private readonly assetItemService: AssetItemService) {}

  @Get()
  findAll(@Query() query: AssetItemQueryDto) {
    return this.assetItemService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query() query: QueryInclude) {
    return this.assetItemService.findOne(id, query.include);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAssetItemDto: UpdateAssetItemDto,
  ) {
    return this.assetItemService.update(id, updateAssetItemDto);
  }
}
