
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/components/ui-custom/ProductCard';

interface CustomerInfo {
  phoneNumber: string;
  name?: string;
  email?: string;
}

export type TransactionState = {
  selectedProduct: Product | null;
  customerInfo: CustomerInfo | null;
  isLoading: boolean;
  currentTransactionId: string | null;
  referenceId: string | null;
  qrString: string | null;
  expiryTime: Date | null;
};

interface TransactionActions {
  selectProduct: (product: Product | null) => void;
  setCustomerInfo: (info: CustomerInfo | null) => void;
  setLoading: (isLoading: boolean) => void;
  setCurrentTransaction: (id: string | null, referenceId: string | null) => void;
  setQRData: (qrString: string | null, expiryTime: Date | null) => void;
  resetTransaction: () => void;
}

const initialState: TransactionState = {
  selectedProduct: null,
  customerInfo: null,
  isLoading: false,
  currentTransactionId: null,
  referenceId: null,
  qrString: null,
  expiryTime: null,
};

export const useTransactionStore = create<TransactionState & TransactionActions>()(
  persist(
    (set) => ({
      ...initialState,
      
      selectProduct: (product) => set({ selectedProduct: product }),
      
      setCustomerInfo: (info) => set({ customerInfo: info }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setCurrentTransaction: (id, referenceId) => 
        set({ currentTransactionId: id, referenceId }),
      
      setQRData: (qrString, expiryTime) => set({ qrString, expiryTime }),
      
      resetTransaction: () => set({
        selectedProduct: null,
        customerInfo: null,
        isLoading: false,
        currentTransactionId: null,
        referenceId: null,
        qrString: null,
        expiryTime: null,
      }),
    }),
    {
      name: 'ppob-transaction-store',
      partialize: (state) => ({
        // Only persist these properties to prevent unwanted state restoration on reload
        currentTransactionId: state.currentTransactionId,
        referenceId: state.referenceId,
      }),
    }
  )
);
