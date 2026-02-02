import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
} from 'class-validator';

export class CreateAssetItemDto {
  @IsNumber()
  @IsPositive({ message: 'Quantity must be greater than 0' })
  @Max(20)
  quantity: number;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsString()
  @IsOptional()
  ownerDeptId?: string;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
