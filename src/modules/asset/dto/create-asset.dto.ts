import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { AssetType } from 'src/schemas/asset.schema';

export class CreateAssetDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsEnum(AssetType)
  type: AssetType;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsUrl()
  purchaseUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
