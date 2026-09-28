export type JerseySize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';

export type PaymentStatus = 'PAID' | 'HALF_PAID' | 'NOT_PAID';

export interface PaymentTransaction {
  id: string;
  amount: number;
  date: string;
  method: 'UPI' | 'Cash' | 'Bank Transfer' | 'Other';
  notes?: string;
}

export interface FriendJerseyOrder {
  id: string;
  name: string;
  phone: string;
  jerseySize: JerseySize;
  jerseyNumber: string;
  jerseyName: string;
  totalJerseyPrice: number;
  amountPaid: number;
  balance: number; // calculated
  status: PaymentStatus; // calculated
  notes: string;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
  paymentHistory: PaymentTransaction[];
}

export interface TeamSettings {
  teamName: string;
  currency: string;
  defaultJerseyPrice: number;
  upiId?: string;
  ownerId?: string;
}

export type StatusFilter = 'ALL' | 'PAID' | 'HALF_PAID' | 'NOT_PAID';
export type SortOption = 'balance_desc' | 'name_asc' | 'jersey_asc' | 'paid_desc' | 'created_desc';
