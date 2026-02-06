import { ConflictException, Injectable } from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Ticket, TicketDocument } from 'src/schemas/ticket.schema';
import { Model, Types } from 'mongoose';
import {
  concat,
  defer,
  forkJoin,
  from,
  map,
  Observable,
  of,
  switchMap,
  throwError,
} from 'rxjs';
import { UploadService } from 'src/services/upload.service';
import { TicketQueryDto } from './dto/ticket-query.dto';
import { TableResponse } from 'src/types/response';

@Injectable()
export class TicketService {
  constructor(
    @InjectModel(Ticket.name) private readonly ticketModel: Model<Ticket>,
    private readonly uploadSrv: UploadService,
  ) {}

  create(dto: CreateTicketDto, userId: string, files?: Express.Multer.File[]) {
    return from(this.ticketModel.findOne({ code: dto.code })).pipe(
      switchMap(existed => {
        if (existed) {
          return throwError(
            () => new ConflictException('Ticket code already exists'),
          );
        }

        const upload$ = files
          ? forkJoin(
              files.map(file =>
                defer(() => this.uploadSrv.uploadFile(file, ['ticket'])),
              ),
            )
          : of([]);

        return upload$.pipe(
          switchMap(imageUrls => {
            return from(
              new this.ticketModel({
                ...dto,
                imageUrls,
                createdBy: new Types.ObjectId(userId),
              }).save(),
            );
          }),
        );
      }),
    );
  }

  findAll(query: TicketQueryDto): Observable<TableResponse<Ticket>> {
    const {
      code,
      title,
      type,
      priority,
      status,
      assetItemId,
      locationId,
      requesterId,
      assigneeId,
      departmentId,
      startDueAt,
      endDueAt,
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      order = 'desc',
    } = query;

    const filter: Record<string, any> = {};

    // text search (partial, case-insensitive)
    if (code) filter.code = { $regex: code, $options: 'i' };
    if (title) filter.title = { $regex: title, $options: 'i' };

    // enums
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (status) filter.status = status;

    // ids
    if (assetItemId) filter.assetItemId = assetItemId;
    if (locationId) filter.locationId = locationId;
    if (requesterId) filter.requesterId = requesterId;

    if (assigneeId) filter.assigneeId = assigneeId;

    if (departmentId) filter.departmentId = departmentId;

    // dueAt range
    if (startDueAt || endDueAt) {
      filter.dueAt = {};
      if (startDueAt) filter.dueAt.$gte = new Date(startDueAt);
      if (endDueAt) filter.dueAt.$lte = new Date(endDueAt);
    }

    // pagination
    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.max(1, Math.min(200, Number(pageSize) || 20));
    const skip = (safePage - 1) * safePageSize;

    // sorting
    const allowedSort = new Set([
      'createdAt',
      'updatedAt',
      'dueAt',
      'priority',
      'status',
      'code',
      'title',
    ]);
    const safeSortBy = allowedSort.has(sortBy) ? sortBy : 'createdAt';
    const sort = { [safeSortBy]: order === 'asc' ? 1 : -1 } as Record<
      string,
      1 | -1
    >;

    const count$ = from(this.ticketModel.countDocuments(filter));
    const data$ = from(
      this.ticketModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(safePageSize)
        .lean()
        .exec(),
    );

    return forkJoin([count$, data$]).pipe(
      map(([total, items]) => {
        return {
          total,
          totalPage: Math.ceil(total / pageSize),
          items,
          page,
          pageSize,
        };
      }),
    );
  }

  findOne(id: number) {
    return `This action returns a #${id} ticket`;
  }

  update(id: number, updateTicketDto: UpdateTicketDto) {
    return `This action updates a #${id} ticket`;
  }

  remove(id: number) {
    return `This action removes a #${id} ticket`;
  }
}
