import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTicketCommentDto {
  @IsMongoId()
  @IsNotEmpty()
  ticketId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsMongoId()
  @IsOptional()
  parentId?: string;
}
