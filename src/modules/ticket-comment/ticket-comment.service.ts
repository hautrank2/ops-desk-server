import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { forkJoin, from, map, Observable, of, switchMap } from 'rxjs';
import {
  TicketComment,
  TicketCommentDocument,
} from 'src/schemas/ticket-comment.schema';
import { UploadService } from 'src/services/upload.service';
import { CreateTicketCommentDto } from './dto/create-ticket-comment.dto';
import { UpdateTicketCommentDto } from './dto/update-ticket-comment.dto';

const MAX_DEPTH = 2;
const UPLOAD_FOLDER = ['ticket-comment'];

@Injectable()
export class TicketCommentService {
  constructor(
    @InjectModel(TicketComment.name)
    private readonly commentModel: Model<TicketCommentDocument>,
    private readonly uploadSrv: UploadService,
  ) { }

  findAll(ticketId: string): Observable<any[]> {
    return from(
      this.commentModel
        .find({ ticketId: new Types.ObjectId(ticketId), isDeleted: false })
        .populate('createdBy', 'name username')
        .populate('updatedBy', 'name username')
        .sort({ createdAt: 1 })
        .lean<any[]>(),
    ).pipe(map((comments) => this.buildTree(comments)));
  }

  create(
    dto: CreateTicketCommentDto,
    userId: string,
    files: Express.Multer.File[],
  ): Observable<TicketCommentDocument> {
    const resolveParent$ = dto.parentId
      ? from(this.commentModel.findById(dto.parentId).lean())
      : of(null);

    return resolveParent$.pipe(
      switchMap((parent) => {
        if (dto.parentId && !parent) {
          throw new NotFoundException('Parent comment not found');
        }

        const depth = parent ? (parent.depth >= MAX_DEPTH ? MAX_DEPTH : parent.depth + 1) : 0;
        // If parent is already at max depth, attach as sibling (reply to its parent)
        const effectiveParentId =
          parent && parent.depth >= MAX_DEPTH ? parent.parentId : (dto.parentId ? new Types.ObjectId(dto.parentId) : null);
        const rootId =
          depth === 0
            ? null
            : parent?.rootId ?? new Types.ObjectId(dto.parentId);

        const uploadAll$ =
          files.length > 0
            ? forkJoin(files.map((f) => this.uploadSrv.uploadFile(f, UPLOAD_FOLDER)))
            : of([] as string[]);

        return uploadAll$.pipe(
          switchMap((imgUrls) => {
            const comment = new this.commentModel({
              ticketId: new Types.ObjectId(dto.ticketId),
              content: dto.content,
              imgUrls,
              parentId: effectiveParentId,
              rootId,
              depth,
              createdBy: new Types.ObjectId(userId),
            });
            return from(comment.save());
          }),
        );
      }),
    );
  }

  update(
    id: string,
    dto: UpdateTicketCommentDto,
    userId: string,
  ): Observable<TicketCommentDocument> {
    return from(this.commentModel.findById(id)).pipe(
      switchMap((comment) => {
        if (!comment || comment.isDeleted) throw new NotFoundException();
        comment.content = dto.content;
        comment.updatedBy = new Types.ObjectId(userId);
        return from(comment.save());
      }),
    );
  }

  // Optimal image update:
  // 1. Delete only images removed by the client (old - kept)
  // 2. Upload only new files
  // 3. Save: kept + newly uploaded
  updateImages(
    id: string,
    keepUrls: string[],
    files: Express.Multer.File[],
    userId: string,
  ): Observable<TicketCommentDocument> {
    return from(this.commentModel.findById(id)).pipe(
      switchMap((comment) => {
        if (!comment || comment.isDeleted) throw new NotFoundException();

        const toDelete = comment.imgUrls.filter((url) => !keepUrls.includes(url));
        const delete$ =
          toDelete.length > 0
            ? forkJoin(toDelete.map((url) => this.uploadSrv.removeFile(url)))
            : of([] as string[]);

        const upload$ =
          files.length > 0
            ? forkJoin(files.map((f) => this.uploadSrv.uploadFile(f, UPLOAD_FOLDER)))
            : of([] as string[]);

        return forkJoin([delete$, upload$]).pipe(
          switchMap(([, newUrls]) => {
            comment.imgUrls = [...keepUrls, ...newUrls];
            comment.updatedBy = new Types.ObjectId(userId);
            return from(comment.save());
          }),
        );
      }),
    );
  }

  remove(id: string, userId: string): Observable<any> {
    return from(this.commentModel.findById(id)).pipe(
      switchMap((comment) => {
        if (!comment || comment.isDeleted) throw new NotFoundException();
        if (comment.createdBy.toString() !== userId) {
          throw new ForbiddenException('You can only delete your own comments');
        }

        // Find all descendants to delete along with this comment
        const query: any = { isDeleted: false };
        if (comment.depth === 0) {
          query.rootId = comment._id;
        } else {
          query.parentId = comment._id;
        }

        const descendants$ = from(this.commentModel.find(query).exec());

        return descendants$.pipe(
          switchMap((descendants) => {
            const allToDelete = [comment, ...descendants];
            const allImgUrls = allToDelete.flatMap((c) => c.imgUrls);

            // Delete images from storage
            const deleteImages$ =
              allImgUrls.length > 0
                ? forkJoin(allImgUrls.map((url) => this.uploadSrv.removeFile(url)))
                : of([]);

            return deleteImages$.pipe(
              switchMap(() => {
                // Soft delete all and clear imgUrls
                const ids = allToDelete.map((c) => c._id);
                return from(
                  this.commentModel.updateMany(
                    { _id: { $in: ids } },
                    { $set: { isDeleted: true, imgUrls: [], updatedBy: new Types.ObjectId(userId) } },
                  ),
                );
              }),
            );
          }),
        );
      }),
    );
  }

  private buildTree(flat: any[]): any[] {
    const map = new Map<string, any>();
    const roots: any[] = [];

    for (const c of flat) {
      map.set(c._id.toString(), { ...c, replies: [] });
    }

    for (const c of map.values()) {
      if (!c.parentId) {
        roots.push(c);
      } else {
        const parent = map.get(c.parentId.toString());
        if (parent) parent.replies.push(c);
      }
    }

    return roots;
  }
}
