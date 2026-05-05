import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateTicketCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}
