import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AssetStatus, AssetType } from 'src/schemas/asset.schema';

export class CreateAssetDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsEnum(AssetType)
  type: AssetType;

  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsString()
  ownerDeptId?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  vendor?: string;
}
