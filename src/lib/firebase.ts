
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  where,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { Transaction } from '@/components/ui-custom/RecentTransactionCard';

// Firebase configuration
// Replace with your own config when ready
const firebaseConfig = {
  apiKey: "AIzaSyD_placeholder_key",
  authDomain: "ppob-app-placeholder.firebaseapp.com",
  projectId: "ppob-app-placeholder",
  storageBucket: "ppob-app-placeholder.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456ghi789jkl"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collection references
const TRANSACTIONS_COLLECTION = 'transactions';

// Types
export type FirebaseTransaction = {
  id?: string;
  referenceId: string;
  transactionId: string;
  customerId: string;  // phone number or customer ID
  type: 'mobile-credit' | 'electricity' | 'data-package';
  productCode: string;
  productName: string;
  amount: number;
  status: 'success' | 'pending' | 'failed';
  qrString?: string;
  expiryTime?: Date;
  details?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
};

// Helper to convert Firestore data to our app data model
const convertToTransaction = (
  doc: QueryDocumentSnapshot<DocumentData>
): Transaction => {
  const data = doc.data() as FirebaseTransaction;
  
  return {
    id: doc.id,
    type: data.type,
    productName: data.productName,
    amount: data.amount,
    customerDetail: data.customerId,
    status: data.status,
    date: (data.createdAt as unknown as Timestamp).toDate(),
  };
};

// Save transaction to Firestore
export const saveTransaction = async (
  transaction: Omit<FirebaseTransaction, 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const now = new Date();
    const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
      ...transaction,
      createdAt: now,
      updatedAt: now,
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }
};

// Get transaction by ID
export const getTransactionById = async (id: string): Promise<FirebaseTransaction | null> => {
  try {
    const docRef = doc(db, TRANSACTIONS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as FirebaseTransaction;
      
      // Convert Firestore Timestamps to JS Dates
      return {
        ...data,
        id: docSnap.id,
        createdAt: (data.createdAt as unknown as Timestamp).toDate(),
        updatedAt: (data.updatedAt as unknown as Timestamp).toDate(),
        expiryTime: data.expiryTime 
          ? (data.expiryTime as unknown as Timestamp).toDate() 
          : undefined,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting transaction:', error);
    throw error;
  }
};

// Get recent transactions
export const getRecentTransactions = async (
  limit = 5
): Promise<Transaction[]> => {
  try {
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(limit)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(convertToTransaction);
  } catch (error) {
    console.error('Error getting recent transactions:', error);
    throw error;
  }
};

// Get transaction by reference ID or transaction ID
export const findTransactionByReference = async (
  referenceValue: string
): Promise<Transaction | null> => {
  try {
    // Try to find by referenceId
    let q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where('referenceId', '==', referenceValue),
      limit(1)
    );
    
    let querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // If not found, try transactionId
      q = query(
        collection(db, TRANSACTIONS_COLLECTION),
        where('transactionId', '==', referenceValue),
        limit(1)
      );
      
      querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
    }
    
    return convertToTransaction(querySnapshot.docs[0]);
  } catch (error) {
    console.error('Error finding transaction:', error);
    throw error;
  }
};

// Update transaction status
export const updateTransactionStatus = async (
  id: string,
  status: 'success' | 'pending' | 'failed',
  details?: Record<string, any>
): Promise<void> => {
  try {
    const docRef = doc(db, TRANSACTIONS_COLLECTION, id);
    const now = new Date();
    
    await docRef.update({
      status,
      details: details || {},
      updatedAt: now,
    });
  } catch (error) {
    console.error('Error updating transaction status:', error);
    throw error;
  }
};

export { db };
