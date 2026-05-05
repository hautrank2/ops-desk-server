import { IsMongoId, IsNotEmpty } from 'class-validator';

export class TicketCommentQueryDto {
  @IsMongoId()
  @IsNotEmpty()
  ticketId: string;
}
