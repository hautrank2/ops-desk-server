import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Ticket } from 'src/schemas/ticket.schema';
import { Model, QueryFilter, Types } from 'mongoose';
import {
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

  findAll(filters: TicketQueryDto): Observable<TableResponse<Ticket>> {
    const {
      code,
      title,
      type,
      priority,
      status,
      assetItemIds,
      locationId,
      assigneeId,
      departmentId,
      startDueAt,
      endDueAt,
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      order = 'desc',
      populations,
      createdBy,
    } = filters;

    const filter: QueryFilter<Ticket> = {};

    // text search (partial, case-insensitive)
    if (code) filter.code = { $regex: code, $options: 'i' };
    if (title) filter.title = { $regex: title, $options: 'i' };

    // enums
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (status) filter.status = status;

    // ids
    if (assetItemIds) filter.assetItemIds = { $all: assetItemIds };
    if (locationId) filter.locationId = locationId;

    if (assigneeId) filter.assigneeId = assigneeId;
    if (createdBy) filter.createdBy = createdBy;

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

    let query = this.ticketModel
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(safePageSize);

    if (populations) {
      query = query.populate(populations);
    }

    const data$ = from(query.lean().exec());

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

  findOne(id: number): Observable<Ticket> {
    return from(this.ticketModel.findById(id).lean()).pipe(
      map(res => {
        if (!res) {
          throw new NotFoundException('Ticket not found');
        }
        return res;
      }),
    );
  }

  update(id: string, updateTicketDto: UpdateTicketDto, userId: string) {
    return from(
      this.ticketModel.findByIdAndUpdate(
        id,
        { ...updateTicketDto, updatedBy: new Types.ObjectId(userId) },
        { new: true },
      ),
    ).pipe(
      map(ticket => {
        if (!ticket) {
          throw new NotFoundException('Asset not found');
        }
        return ticket;
      }),
    );
  }

  addImages(id: string, imgs: Express.Multer.File[], userId: string) {
    return from(this.ticketModel.findById(id)).pipe(
      switchMap(ticket => {
        if (!ticket) {
          return throwError(() => new NotFoundException('Asset not found'));
        }
        const upload$ = imgs
          ? forkJoin(
              imgs.map(file =>
                defer(() => this.uploadSrv.uploadFile(file, ['ticket'])),
              ),
            )
          : of([]);

        return upload$.pipe(
          switchMap(imgUrls => {
            ticket.imageUrls.push(...imgUrls);
            ticket.updatedBy = new Types.ObjectId(userId);
            return from(ticket.save());
          }),
        );
      }),
    );
  }

  removeImages(id: string, index: number, userId: string) {
    return from(this.ticketModel.findById(id)).pipe(
      switchMap(ticket => {
        if (!ticket) {
          return throwError(() => new NotFoundException('Asset not found'));
        }

        if (index < 0 || index >= ticket.imageUrls.length) {
          return throwError(
            () => new BadRequestException('Invalid image index'),
          );
        }

        const removedImgUrl = ticket.imageUrls[index];

        return this.uploadSrv.removeFile(removedImgUrl).pipe(
          switchMap(() => {
            ticket.imageUrls.splice(index, 1);
            ticket.updatedBy = new Types.ObjectId(userId);
            return from(ticket.save());
          }),
        );
      }),
    );
  }
}
