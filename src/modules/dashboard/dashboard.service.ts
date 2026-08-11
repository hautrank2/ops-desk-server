import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model, Types } from 'mongoose';
import { Asset } from 'src/schemas/asset.schema';
import { Item, ItemStatus } from 'src/schemas/item.schema';
import { Location } from 'src/schemas/location.schema';
import {
  Ticket,
  TicketPriority,
  TicketStatus,
} from 'src/schemas/ticket.schema';
import { User } from 'src/schemas/user.schema';

type CountBucket = { _id: string | null; count: number };

const CLOSED_STATUSES = [TicketStatus.Done, TicketStatus.Cancelled];

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Asset.name) private assetModel: Model<Asset>,
    @InjectModel(Item.name) private itemModel: Model<Item>,
    @InjectModel(Ticket.name) private ticketModel: Model<Ticket>,
    @InjectModel(Location.name) private locationModel: Model<Location>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  /** Turn aggregation buckets into a record pre-filled with every enum key = 0 */
  private toBreakdown<T extends string>(
    keys: readonly T[],
    buckets: CountBucket[],
  ): Record<T, number> {
    const result = keys.reduce(
      (acc, key) => {
        acc[key] = 0;
        return acc;
      },
      {} as Record<T, number>,
    );

    for (const bucket of buckets) {
      if (bucket._id && bucket._id in result) {
        result[bucket._id as T] = bucket.count;
      }
    }

    return result;
  }

  /** Ticket status / priority breakdowns constrained to `match` */
  private async ticketBreakdowns(match: QueryFilter<Ticket>) {
    const [byStatusRaw, byPriorityRaw] = await Promise.all([
      this.ticketModel
        .aggregate<CountBucket>([
          { $match: match },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ])
        .exec(),
      this.ticketModel
        .aggregate<CountBucket>([
          { $match: match },
          { $group: { _id: '$priority', count: { $sum: 1 } } },
        ])
        .exec(),
    ]);

    return {
      byStatus: this.toBreakdown(Object.values(TicketStatus), byStatusRaw),
      byPriority: this.toBreakdown(
        Object.values(TicketPriority),
        byPriorityRaw,
      ),
    };
  }

  private recentTickets(match: QueryFilter<Ticket> = {}) {
    return this.ticketModel
      .find(match)
      .sort({ createdAt: -1 })
      .limit(5)
      .select('code title status priority createdAt')
      .lean()
      .exec();
  }

  // ─── Admin: full system overview ──────────────────────────────────────────
  async getAdminOverview() {
    const now = new Date();

    const [
      assets,
      items,
      tickets,
      locations,
      users,
      open,
      overdue,
      itemsByStatusRaw,
      ticketBreakdowns,
      recentTickets,
    ] = await Promise.all([
      this.assetModel.countDocuments().exec(),
      this.itemModel.countDocuments().exec(),
      this.ticketModel.countDocuments().exec(),
      this.locationModel.countDocuments().exec(),
      this.userModel.countDocuments().exec(),
      this.ticketModel
        .countDocuments({ status: { $nin: CLOSED_STATUSES } })
        .exec(),
      this.ticketModel
        .countDocuments({
          dueAt: { $ne: null, $lt: now },
          status: { $nin: CLOSED_STATUSES },
        })
        .exec(),
      this.itemModel
        .aggregate<CountBucket>([
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ])
        .exec(),
      this.ticketBreakdowns({}),
      this.recentTickets(),
    ]);

    return {
      totals: { assets, items, tickets, locations, users },
      tickets: { open, overdue, ...ticketBreakdowns },
      items: {
        byStatus: this.toBreakdown(Object.values(ItemStatus), itemsByStatusRaw),
      },
      recentTickets,
    };
  }

  // ─── Manager: operational overview (no user stats, adds unassigned) ────────
  async getManagerOverview() {
    const now = new Date();
    const unassignedFilter: QueryFilter<Ticket> = {
      status: { $nin: CLOSED_STATUSES },
      $or: [
        { assigneeId: { $exists: false } },
        { assigneeId: null },
        { assigneeId: '' },
      ],
    };

    const [
      assets,
      items,
      tickets,
      locations,
      open,
      overdue,
      unassigned,
      itemsByStatusRaw,
      ticketBreakdowns,
      recentTickets,
    ] = await Promise.all([
      this.assetModel.countDocuments().exec(),
      this.itemModel.countDocuments().exec(),
      this.ticketModel.countDocuments().exec(),
      this.locationModel.countDocuments().exec(),
      this.ticketModel
        .countDocuments({ status: { $nin: CLOSED_STATUSES } })
        .exec(),
      this.ticketModel
        .countDocuments({
          dueAt: { $ne: null, $lt: now },
          status: { $nin: CLOSED_STATUSES },
        })
        .exec(),
      this.ticketModel.countDocuments(unassignedFilter).exec(),
      this.itemModel
        .aggregate<CountBucket>([
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ])
        .exec(),
      this.ticketBreakdowns({}),
      this.recentTickets(),
    ]);

    return {
      totals: { assets, items, tickets, locations },
      tickets: { open, overdue, unassigned, ...ticketBreakdowns },
      items: {
        byStatus: this.toBreakdown(Object.values(ItemStatus), itemsByStatusRaw),
      },
      recentTickets,
    };
  }

  // ─── User: personal overview (only my tickets) ─────────────────────────────
  async getUserOverview(userId: string) {
    const now = new Date();
    const createdByMe: QueryFilter<Ticket> = {
      createdBy: new Types.ObjectId(userId),
    };
    const assignedToMe: QueryFilter<Ticket> = { assigneeId: userId };
    const mine: QueryFilter<Ticket> = {
      $or: [createdByMe, assignedToMe],
    };

    const [
      myTickets,
      createdCount,
      assignedCount,
      open,
      overdue,
      ticketBreakdowns,
      recentTickets,
    ] = await Promise.all([
      this.ticketModel.countDocuments(mine).exec(),
      this.ticketModel.countDocuments(createdByMe).exec(),
      this.ticketModel.countDocuments(assignedToMe).exec(),
      this.ticketModel
        .countDocuments({ ...mine, status: { $nin: CLOSED_STATUSES } })
        .exec(),
      this.ticketModel
        .countDocuments({
          ...mine,
          dueAt: { $ne: null, $lt: now },
          status: { $nin: CLOSED_STATUSES },
        })
        .exec(),
      this.ticketBreakdowns(mine),
      this.recentTickets(mine),
    ]);

    return {
      totals: {
        myTickets,
        createdByMe: createdCount,
        assignedToMe: assignedCount,
      },
      tickets: { open, overdue, ...ticketBreakdowns },
      recentTickets,
    };
  }
}
