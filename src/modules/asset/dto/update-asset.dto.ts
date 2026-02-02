import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateAssetDto } from './create-asset.dto';

export class UpdateAssetDto extends PartialType(
  OmitType(CreateAssetDto, ['code']),
) {}
