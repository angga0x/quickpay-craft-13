import { supabase } from "@/integrations/supabase/client";
import { TransactionStatus, TransactionType, TransactionData } from './types';

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
    const { data: result, error } = await supabase
      .from('transactions')
      .insert({
        reference_id: data.reference_id,
        transaction_id: data.transaction_id,
        customer_id: data.customer_id,
        type: data.type,
        product_code: data.product_code,
        product_name: data.product_name,
        amount: data.amount,
        status: data.status,
        qr_string: data.qr_string,
        expiry_time: data.expiry_time.toISOString(),
        payment_order_id: data.payment_order_id,
        payment_code: data.payment_code,
        payment_url: data.payment_url,
        details: data.details,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return result.id;
  } catch (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }
};

// Get a transaction by ID
export const getTransaction = async (id: string): Promise<SupabaseTransaction | null> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      ...data,
      expiry_time: data.expiry_time ? new Date(data.expiry_time) : null,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    } as SupabaseTransaction;
  } catch (error) {
    console.error('Error getting transaction:', error);
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
    const { error } = await supabase
      .from('transactions')
      .update({
        status,
        ...(details && { details }),
        updated_at: new Date().toISOString()
      })
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
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit_count);

    if (error) throw error;
    return data.map(transaction => ({
      ...transaction,
      expiry_time: transaction.expiry_time ? new Date(transaction.expiry_time) : null,
      created_at: new Date(transaction.created_at),
      updated_at: new Date(transaction.updated_at)
    })) as SupabaseTransaction[];
  } catch (error) {
    console.error('Error getting recent transactions:', error);
    throw error;
  }
};

// Find transaction by reference ID
export const findTransactionByReference = async (referenceId: string): Promise<SupabaseTransaction | null> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('reference_id', referenceId)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      ...data,
      expiry_time: data.expiry_time ? new Date(data.expiry_time) : null,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    } as SupabaseTransaction;
  } catch (error) {
    console.error('Error finding transaction by reference:', error);
    throw error;
  }
};

// Helper function to convert Supabase Transaction to UI format
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
