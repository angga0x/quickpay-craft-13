
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  DocumentData
} from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBFvOQl0DiXJJ6-Y7wfyuCCDEXKiuCqDpM",
  authDomain: "ppob-app-demo.firebaseapp.com",
  projectId: "ppob-app-demo",
  storageBucket: "ppob-app-demo.appspot.com",
  messagingSenderId: "851204211589",
  appId: "1:851204211589:web:54ebab7e7c5c0ce44e1a22"
};

// Initialize Firebase - in a real app, use environment variables for config
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Transaction types
export type TransactionType = 'mobile-credit' | 'electricity' | 'data-package';

export type TransactionStatus = 'pending' | 'success' | 'failed';

// Transaction data type
export type Transaction = {
  id: string;
  referenceId: string;
  transactionId: string;
  customerId: string;
  type: TransactionType;
  productCode: string;
  productName: string;
  amount: number;
  status: TransactionStatus;
  qrString: string;
  expiryTime: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type TransactionData = {
  referenceId: string;
  transactionId: string;
  customerId: string;
  type: TransactionType;
  productCode: string;
  productName: string;
  amount: number;
  status: TransactionStatus;
  qrString: string;
  expiryTime: Date;
};

// Save a transaction
export const saveTransaction = async (data: TransactionData): Promise<string> => {
  try {
    if (import.meta.env.DEV && !import.meta.env.VITE_USE_FIREBASE) {
      console.log('DEV mode: Mock saving transaction', data);
      return 'mock-transaction-id';
    }
    
    const transactionsRef = collection(db, 'transactions');
    const docRef = await addDoc(transactionsRef, {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }
};

// Get a transaction by ID
export const getTransaction = async (id: string): Promise<Transaction | null> => {
  try {
    if (import.meta.env.DEV && !import.meta.env.VITE_USE_FIREBASE) {
      console.log('DEV mode: Mock getting transaction', id);
      
      // Mock transaction data
      return {
        id,
        referenceId: 'REF123456789',
        transactionId: 'TRX-ABCDEFG',
        customerId: '0812-3456-7890',
        type: 'mobile-credit',
        productCode: 'TSEL10',
        productName: 'Telkomsel 10.000',
        amount: 10500,
        status: 'pending',
        qrString: '00020101021226570014A00000007750415530303611012345678901520400005303360540...',
        expiryTime: new Date(Date.now() + 15 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
    const docRef = doc(db, 'transactions', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        expiryTime: data.expiryTime.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as Transaction;
    }
    
    return null;
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
    if (import.meta.env.DEV && !import.meta.env.VITE_USE_FIREBASE) {
      console.log('DEV mode: Mock updating transaction status', { id, status, details });
      return true;
    }
    
    const docRef = doc(db, 'transactions', id);
    await updateDoc(docRef, {
      status,
      ...(details && { details }),
      updatedAt: Timestamp.now()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating transaction status:', error);
    throw error;
  }
};

// Get recent transactions
export const getRecentTransactions = async (limit_count: number = 5): Promise<Transaction[]> => {
  try {
    if (import.meta.env.DEV && !import.meta.env.VITE_USE_FIREBASE) {
      console.log('DEV mode: Mock getting recent transactions');
      
      // Mock transactions
      return Array.from({ length: limit_count }, (_, i) => ({
        id: `mock-id-${i}`,
        referenceId: `REF12345678${i}`,
        transactionId: `TRX-ABCDEF${i}`,
        customerId: '0812-3456-7890',
        type: ['mobile-credit', 'electricity', 'data-package'][i % 3] as TransactionType,
        productCode: `PROD${i}`,
        productName: `Product ${i}`,
        amount: 10000 * (i + 1),
        status: ['pending', 'success', 'failed'][i % 3] as TransactionStatus,
        qrString: '00020101021226570014A00000007750415530303611012345678901520400005303360540...',
        expiryTime: new Date(Date.now() + 15 * 60 * 1000),
        createdAt: new Date(Date.now() - i * 86400000),
        updatedAt: new Date(Date.now() - i * 86400000)
      }));
    }
    
    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      orderBy('createdAt', 'desc'),
      limit(limit_count)
    );
    
    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...data,
        expiryTime: data.expiryTime.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as Transaction);
    });
    
    return transactions;
  } catch (error) {
    console.error('Error getting recent transactions:', error);
    throw error;
  }
};

// Find transaction by reference ID
export const findTransactionByReference = async (referenceId: string): Promise<Transaction | null> => {
  try {
    if (import.meta.env.DEV && !import.meta.env.VITE_USE_FIREBASE) {
      console.log('DEV mode: Mock finding transaction by reference', referenceId);
      
      // Mock transaction data
      return {
        id: 'mock-id',
        referenceId,
        transactionId: 'TRX-ABCDEFG',
        customerId: '0812-3456-7890',
        type: 'mobile-credit',
        productCode: 'TSEL10',
        productName: 'Telkomsel 10.000',
        amount: 10500,
        status: Math.random() > 0.3 ? 'success' : 'pending',
        qrString: '00020101021226570014A00000007750415530303611012345678901520400005303360540...',
        expiryTime: new Date(Date.now() + 15 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('referenceId', '==', referenceId),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        expiryTime: data.expiryTime.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as Transaction;
    }
    
    return null;
  } catch (error) {
    console.error('Error finding transaction by reference:', error);
    throw error;
  }
};

export default db;
