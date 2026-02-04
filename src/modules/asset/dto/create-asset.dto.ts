import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { AssetType } from 'src/schemas/asset.schema';

export class CreateAssetDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: AssetType })
  @IsEnum(AssetType)
  type: AssetType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  purchaseUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateAssetFormDataDto extends CreateAssetDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Upload multiple images',
  })
  images: any[];
}
