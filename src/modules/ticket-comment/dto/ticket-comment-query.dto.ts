import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class TicketCommentQueryDto {
  @ApiProperty({
    description: 'Search by ticket',
    example: '698b3972101261aa3a2690f1',
  })
  @IsMongoId()
  @IsNotEmpty()
  ticketId: string;
}
