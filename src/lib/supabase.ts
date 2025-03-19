
import { supabase } from "@/integrations/supabase/client";
import { Transaction as FirebaseTransaction, TransactionData, TransactionStatus, TransactionType } from './firebase';

// Supabase transaction type
export type SupabaseTransaction = {
  id: string;
  reference_id: string;
  transaction_id: string;
  customer_id: string;
  type: TransactionType;
  product_code: string;
  product_name: string;
  amount: number;
  status: TransactionStatus;
  qr_string: string | null;
  expiry_time: Date | null;
  created_at: Date;
  updated_at: Date;
  payment_order_id?: string;
  payment_code?: string;
  payment_url?: string;
  details?: Record<string, any>;
};

// Save a transaction
export const saveTransaction = async (data: TransactionData): Promise<string> => {
  try {
    if (import.meta.env.DEV && !import.meta.env.VITE_USE_SUPABASE) {
      console.log('DEV mode: Mock saving transaction', data);
      return 'mock-transaction-id';
    }
    
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        reference_id: data.referenceId,
        transaction_id: data.transactionId,
        customer_id: data.customerId,
        type: data.type,
        product_code: data.productCode,
        product_name: data.productName,
        amount: data.amount,
        status: data.status,
        qr_string: data.qrString || null,
        expiry_time: data.expiryTime ? data.expiryTime.toISOString() : null,
        payment_order_id: data.paymentOrderId,
        payment_code: data.paymentCode,
        payment_url: data.paymentUrl,
        details: data.details || {}
      })
      .select('id')
      .single();
    
    if (error) throw error;
    
    return transaction.id;
  } catch (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }
};

// Get a transaction by ID
export const getTransaction = async (id: string): Promise<SupabaseTransaction | null> => {
  try {
    if (import.meta.env.DEV && !import.meta.env.VITE_USE_SUPABASE) {
      console.log('DEV mode: Mock getting transaction', id);
      
      // Mock transaction data
      return {
        id,
        reference_id: 'REF123456789',
        transaction_id: 'TRX-ABCDEFG',
        customer_id: '0812-3456-7890',
        type: 'mobile-credit',
        product_code: 'TSEL10',
        product_name: 'Telkomsel 10.000',
        amount: 10500,
        status: 'pending',
        qr_string: '00020101021226570014A00000007750415530303611012345678901520400005303360540...',
        expiry_time: new Date(Date.now() + 15 * 60 * 1000),
        created_at: new Date(),
        updated_at: new Date()
      };
    }
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    if (!data) return null;
    
    return {
      ...data,
      id: data.id,
      reference_id: data.reference_id,
      transaction_id: data.transaction_id,
      customer_id: data.customer_id,
      product_code: data.product_code,
      product_name: data.product_name,
      qr_string: data.qr_string,
      payment_order_id: data.payment_order_id,
      payment_code: data.payment_code,
      payment_url: data.payment_url,
      expiry_time: data.expiry_time ? new Date(data.expiry_time) : null,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    } as SupabaseTransaction;
  } catch (error) {
    console.error('Error getting transaction:', error);
    throw error;
  }
};

// Find transaction by reference ID
export const findTransactionByReference = async (referenceId: string): Promise<SupabaseTransaction | null> => {
  try {
    if (import.meta.env.DEV && !import.meta.env.VITE_USE_SUPABASE) {
      console.log('DEV mode: Mock finding transaction by reference', referenceId);
      
      // Mock transaction data
      return {
        id: 'mock-id',
        reference_id: referenceId,
        transaction_id: 'TRX-ABCDEFG',
        customer_id: '0812-3456-7890',
        type: 'mobile-credit',
        product_code: 'TSEL10',
        product_name: 'Telkomsel 10.000',
        amount: 10500,
        status: Math.random() > 0.3 ? 'success' : 'pending',
        qr_string: '00020101021226570014A00000007750415530303611012345678901520400005303360540...',
        expiry_time: new Date(Date.now() + 15 * 60 * 1000),
        created_at: new Date(),
        updated_at: new Date()
      };
    }
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('reference_id', referenceId)
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    if (!data) return null;
    
    return {
      ...data,
      id: data.id,
      reference_id: data.reference_id,
      transaction_id: data.transaction_id,
      customer_id: data.customer_id,
      product_code: data.product_code,
      product_name: data.product_name,
      qr_string: data.qr_string,
      payment_order_id: data.payment_order_id,
      payment_code: data.payment_code,
      payment_url: data.payment_url,
      expiry_time: data.expiry_time ? new Date(data.expiry_time) : null,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    } as SupabaseTransaction;
  } catch (error) {
    console.error('Error finding transaction by reference:', error);
    throw error;
  }
};

// Update transaction status
export const updateTransactionStatus = async (
  id: string, 
  status: TransactionStatus,
  details?: Record<string, any>
): Promise<boolean> => {
  try {
    if (import.meta.env.DEV && !import.meta.env.VITE_USE_SUPABASE) {
      console.log('DEV mode: Mock updating transaction status', { id, status, details });
      return true;
    }
    
    const updateData: any = { status };
    if (details) updateData.details = details;
    
    const { error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating transaction status:', error);
    throw error;
  }
};

// Get recent transactions
export const getRecentTransactions = async (limit_count: number = 5): Promise<SupabaseTransaction[]> => {
  try {
    if (import.meta.env.DEV && !import.meta.env.VITE_USE_SUPABASE) {
      console.log('DEV mode: Mock getting recent transactions');
      
      // Mock transactions
      return Array.from({ length: limit_count }, (_, i) => ({
        id: `mock-id-${i}`,
        reference_id: `REF12345678${i}`,
        transaction_id: `TRX-ABCDEF${i}`,
        customer_id: '0812-3456-7890',
        type: ['mobile-credit', 'electricity', 'data-package'][i % 3] as TransactionType,
        product_code: `PROD${i}`,
        product_name: `Product ${i}`,
        amount: 10000 * (i + 1),
        status: ['pending', 'success', 'failed'][i % 3] as TransactionStatus,
        qr_string: '00020101021226570014A00000007750415530303611012345678901520400005303360540...',
        expiry_time: new Date(Date.now() + 15 * 60 * 1000),
        created_at: new Date(Date.now() - i * 86400000),
        updated_at: new Date(Date.now() - i * 86400000)
      }));
    }
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit_count);
    
    if (error) throw error;
    
    return (data || []).map(item => ({
      ...item,
      id: item.id,
      reference_id: item.reference_id,
      transaction_id: item.transaction_id,
      customer_id: item.customer_id,
      product_code: item.product_code,
      product_name: item.product_name,
      qr_string: item.qr_string,
      payment_order_id: item.payment_order_id,
      payment_code: item.payment_code,
      payment_url: item.payment_url,
      expiry_time: item.expiry_time ? new Date(item.expiry_time) : null,
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at)
    })) as SupabaseTransaction[];
  } catch (error) {
    console.error('Error getting recent transactions:', error);
    throw error;
  }
};

// Helper function to convert Supabase Transaction to RecentTransactionCard.Transaction
export const toRecentTransactionFormat = (transaction: SupabaseTransaction) => {
  return {
    id: transaction.id,
    type: transaction.type,
    productName: transaction.product_name,
    amount: transaction.amount,
    customerDetail: transaction.customer_id,
    status: transaction.status,
    date: transaction.created_at
  };
};

// Export a SupabaseTransaction to the Firebase Transaction format for backward compatibility
export const toFirebaseTransaction = (transaction: SupabaseTransaction): FirebaseTransaction => {
  return {
    id: transaction.id,
    referenceId: transaction.reference_id,
    transactionId: transaction.transaction_id,
    customerId: transaction.customer_id,
    type: transaction.type,
    productCode: transaction.product_code,
    productName: transaction.product_name,
    amount: transaction.amount,
    status: transaction.status,
    qrString: transaction.qr_string || '',
    expiryTime: transaction.expiry_time || new Date(),
    createdAt: transaction.created_at,
    updatedAt: transaction.updated_at,
    paymentOrderId: transaction.payment_order_id,
    paymentCode: transaction.payment_code,
    paymentUrl: transaction.payment_url,
    details: transaction.details
  };
};
