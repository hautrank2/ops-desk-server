import { IsArray, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateTicketCommentImagesDto {
  // Cloudinary public_ids of existing images to keep.
  // Any current imgUrl NOT in this list will be deleted from Cloudinary.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : []))
  keepUrls?: string[];
}
