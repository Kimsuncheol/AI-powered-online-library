export type CheckoutStatus = 'requested' | 'checked_out' | 'returned' | 'overdue' | 'cancelled' | 'lost';

export interface CheckoutBase {
  id: string;
  bookId: string;
  memberId: string;
  status: CheckoutStatus;
  checkedOutAt?: string;
  dueAt: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  returnedAt?: string | null;
}

export type CheckoutOut = CheckoutBase;

export interface CheckoutCreate {
  bookId: string;
  memberId?: string | null;
  dueAt?: string | null;
  notes?: string | null;
}

export interface CheckoutUpdate {
  action?: 'return' | 'extend' | 'cancel' | 'mark_lost';
  days?: number;
  newDueAt?: string | null;
  status?: CheckoutStatus;
  dueAt?: string | null;
  notes?: string | null;
  returnedAt?: string | null;
}
