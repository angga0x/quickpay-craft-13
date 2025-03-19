// Transaction types
export type TransactionType = 'mobile-credit' | 'electricity' | 'data-package';

export type TransactionStatus = 'pending' | 'success' | 'failed';

// Base transaction data type
export type TransactionData = {
  reference_id: string;
  transaction_id: string;
  customer_id: string;
  type: TransactionType;
  product_code: string;
  product_name: string;
  amount: number;
  status: TransactionStatus;
  qr_string: string;
  expiry_time: Date;
  payment_order_id?: string;
  payment_code?: string;
  payment_url?: string;
  details?: Record<string, any>;
}; 