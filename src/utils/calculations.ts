import { PaymentStatus, JerseySize, FriendJerseyOrder } from '../types/jersey';

/**
 * Calculates remaining balance:
 * Balance = Total Jersey Price - Amount Paid
 * Ensures balance is never negative (minimum 0).
 */
export function calculateBalance(totalPrice: number, amountPaid: number): number {
  const safeTotal = Math.max(0, Number(totalPrice) || 0);
  const safePaid = Math.max(0, Number(amountPaid) || 0);
  const balance = safeTotal - safePaid;
  return balance > 0 ? balance : 0;
}

/**
 * Automatically determine status:
 * IF Amount Paid = 0 -> NOT PAID
 * IF Amount Paid > 0 AND Amount Paid < Total Jersey Price -> HALF PAID
 * IF Amount Paid >= Total Jersey Price -> PAID
 */
export function calculatePaymentStatus(totalPrice: number, amountPaid: number): PaymentStatus {
  const safeTotal = Math.max(0, Number(totalPrice) || 0);
  const safePaid = Math.max(0, Number(amountPaid) || 0);

  if (safePaid <= 0) {
    return 'NOT_PAID';
  }
  if (safePaid >= safeTotal) {
    return 'PAID';
  }
  return 'HALF_PAID';
}

/**
 * Formats monetary amounts with user selected currency
 */
export function formatCurrency(amount: number, currency = '₹'): string {
  const safe = Number(amount) || 0;
  return `${currency}${safe.toLocaleString('en-IN')}`;
}

export const JERSEY_SIZES: JerseySize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

export function getStatusConfig(status: PaymentStatus) {
  switch (status) {
    case 'PAID':
      return {
        label: 'PAID',
        dot: '🟢',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
        textClass: 'text-emerald-400',
        bgClass: 'bg-emerald-500',
      };
    case 'HALF_PAID':
      return {
        label: 'HALF PAID',
        dot: '🟡',
        badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
        textClass: 'text-amber-400',
        bgClass: 'bg-amber-500',
      };
    case 'NOT_PAID':
      return {
        label: 'NOT PAID',
        dot: '🔴',
        badgeClass: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
        textClass: 'text-rose-400',
        bgClass: 'bg-rose-500',
      };
  }
}

/**
 * Generates WhatsApp reminder URL with pre-filled message
 */
export function generateWhatsAppLink(
  friend: FriendJerseyOrder,
  teamName: string,
  currency: string,
  upiId?: string
): string {
  const cleanPhone = friend.phone.replace(/[^0-9]/g, '');
  
  let msg = `🏏 *${teamName} - Jersey Order Reminder*\n\n`;
  msg += `Hey *${friend.name}*! 👋\n\n`;
  msg += `Here is your jersey order summary:\n`;
  msg += `• *Name on Jersey:* ${friend.jerseyName || friend.name}\n`;
  msg += `• *Jersey Number:* #${friend.jerseyNumber}\n`;
  msg += `• *Size:* ${friend.jerseySize}\n`;
  msg += `• *Total Price:* ${formatCurrency(friend.totalJerseyPrice, currency)}\n`;
  msg += `• *Amount Paid:* ${formatCurrency(friend.amountPaid, currency)}\n`;
  msg += `• *Remaining Balance:* *${formatCurrency(friend.balance, currency)}*\n\n`;

  if (friend.balance > 0) {
    msg += `⚠️ Please clear the pending balance of *${formatCurrency(friend.balance, currency)}* at the earliest so we can finalize the printing batch with the vendor.\n`;
    if (upiId) {
      msg += `\n📲 Pay via UPI: *${upiId}*\n`;
    }
  } else {
    msg += `✅ Your jersey payment is complete! Thank you.\n`;
  }

  msg += `\nThank you! 🏆`;

  const encoded = encodeURIComponent(msg);
  return cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}

/**
 * Exports jersey orders to CSV format
 */
export function exportToCSV(orders: FriendJerseyOrder[], teamName: string) {
  const headers = [
    'Friend Name',
    'Phone',
    'Jersey Name',
    'Jersey Number',
    'Size',
    'Total Price',
    'Amount Paid',
    'Remaining Balance',
    'Payment Status',
    'Notes',
  ];

  const rows = orders.map((o) => [
    `"${o.name.replace(/"/g, '""')}"`,
    `"${o.phone}"`,
    `"${o.jerseyName.replace(/"/g, '""')}"`,
    `"${o.jerseyNumber}"`,
    `"${o.jerseySize}"`,
    o.totalJerseyPrice,
    o.amountPaid,
    o.balance,
    o.status,
    `"${(o.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${teamName.toLowerCase().replace(/\s+/g, '_')}_jersey_payments.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
