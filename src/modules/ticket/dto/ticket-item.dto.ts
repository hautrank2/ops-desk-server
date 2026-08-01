import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { AssetItemQueryDto } from 'src/modules/asset-item/dto/asset-item-query.dto';

export class AddTicketAssetItemDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Upload multiple images',
  })
  itemIds: string[];
}

export class RemoveTicketAssetItemDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Upload multiple images',
  })
  itemIds: string[];
}

export class TicketAssetItemQueryDto extends PartialType(
  OmitType(AssetItemQueryDto, ['page', 'pageSize'] as const),
) {}
