import { ApiProperty } from '@nestjs/swagger';

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
