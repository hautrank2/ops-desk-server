import { PartialType } from '@nestjs/mapped-types';
import { CreateAssetItemDto } from './create-asset-item.dto';

export class UpdateAssetItemDto extends PartialType(CreateAssetItemDto) {}
