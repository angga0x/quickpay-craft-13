import axios from 'axios';
import { PriceType, MobileCreditProduct, ElectricityProduct, DataPackageProduct } from './api';
import CryptoJS from 'crypto-js';

// API URL (direct to Digiflazz)
const API_URL = 'https://api.digiflazz.com/v1';

// Default profit margins in percentage
const DEFAULT_MARGINS = {
  'mobile-credit': 5,  // 5% margin for mobile credits
  'electricity': 3,    // 3% margin for electricity
  'data-package': 7,   // 7% margin for data packages
};

// Create signature for Digiflazz API authentication
const createSignature = (payload: any): string => {
  const username = import.meta.env.VITE_DIGIFLAZZ_USERNAME;
  const apiKey = import.meta.env.VITE_DIGIFLAZZ_KEY;
  
  // For price list, use username + key
  if (payload.cmd === 'pricelist') {
    return CryptoJS.MD5(username + apiKey + 'pricelist').toString();
  }
  
  // For transactions, use username + key + ref_id
  return CryptoJS.MD5(username + apiKey + (payload.ref_id || '')).toString();
};

// Calculate selling price based on product type
const calculateSellingPrice = (basePrice: number, type: keyof typeof DEFAULT_MARGINS): number => {
  const margin = DEFAULT_MARGINS[type] / 100;
  return Math.ceil(basePrice * (1 + margin));
};

// Format API response for mobile credit products
const formatMobileCreditProduct = (item: any): MobileCreditProduct => {
  const basePrice = parseFloat(item.price);
  
  return {
    product_code: item.buyer_sku_code,
    operator: item.brand,
    description: item.product_name,
    amount: parseInt(item.buyer_sku_code.replace(/[^0-9]/g, '')) || 0,
    price: {
      basePrice,
      sellingPrice: calculateSellingPrice(basePrice, 'mobile-credit')
    }
  };
};

// Format API response for electricity products
const formatElectricityProduct = (item: any): ElectricityProduct => {
  const basePrice = parseFloat(item.price);
  
  return {
    product_code: item.buyer_sku_code,
    description: item.product_name,
    amount: parseInt(item.product_name.replace(/[^0-9]/g, '')) || 0,
    price: {
      basePrice,
      sellingPrice: calculateSellingPrice(basePrice, 'electricity')
    }
  };
};

// Format API response for data package products
const formatDataPackageProduct = (item: any): DataPackageProduct => {
  const basePrice = parseFloat(item.price);
  
  return {
    product_code: item.buyer_sku_code,
    operator: item.brand,
    description: item.product_name,
    details: item.desc || '',
    price: {
      basePrice,
      sellingPrice: calculateSellingPrice(basePrice, 'data-package')
    }
  };
};

// Make direct API calls to Digiflazz
const makeApiRequest = async (endpoint: string, payload: any) => {
  try {
    console.log(`Making request to ${endpoint} with payload:`, payload);
    
    // Add required Digiflazz authentication
    const authPayload = {
      ...payload,
      username: import.meta.env.VITE_DIGIFLAZZ_USERNAME,
      sign: createSignature(payload)
    };
    
    const response = await axios.post(`${API_URL}/${endpoint}`, authPayload);
    return response;
  } catch (error) {
    console.error(`Error making request to ${endpoint}:`, error);
    throw error;
  }
};

// Get price list from Digiflazz API
export const getPriceList = async () => {
  try {
    // In DEV environment, we can use a mock API or the real one
    if (import.meta.env.DEV && !import.meta.env.VITE_USE_DIGIFLAZZ) {
      console.log('Using mock Digiflazz API response for price list');
      // Return mock data or fetch from a local JSON file
      return import('./mockPriceList.json');
    }
    
    const response = await makeApiRequest('price-list', { cmd: 'prepaid' });
    return response.data;
  } catch (error) {
    console.error('Error fetching price list from Digiflazz:', error);
    // Fallback to mock data if API request fails
    console.log('Falling back to mock data due to API error');
    return import('./mockPriceList.json');
  }
};

// Get mobile credit products
export const getMobileCreditProducts = async (): Promise<MobileCreditProduct[]> => {
  try {
    const priceList = await getPriceList();
    const data = priceList.data || [];
    
    // Filter and map products that are mobile credit
    const products = data
      .filter((item: any) => 
        item.category === 'Pulsa' && 
        item.buyer_product_status && 
        item.buyer_product_status === true
      )
      .map(formatMobileCreditProduct);
    
    return products;
  } catch (error) {
    console.error('Error fetching mobile credit products:', error);
    throw error;
  }
};

// Get electricity products
export const getElectricityProducts = async (): Promise<ElectricityProduct[]> => {
  try {
    const priceList = await getPriceList();
    const data = priceList.data || [];
    
    // Filter and map products that are electricity tokens
    const products = data
      .filter((item: any) => 
        item.category === 'PLN' && 
        item.buyer_product_status && 
        item.buyer_product_status === true
      )
      .map(formatElectricityProduct);
    
    return products;
  } catch (error) {
    console.error('Error fetching electricity products:', error);
    throw error;
  }
};

// Get data package products
export const getDataPackageProducts = async (): Promise<DataPackageProduct[]> => {
  try {
    const priceList = await getPriceList();
    const data = priceList.data || [];
    
    // Filter and map products that are data packages
    const products = data
      .filter((item: any) => 
        item.category === 'Data' && 
        item.buyer_product_status && 
        item.buyer_product_status === true
      )
      .map(formatDataPackageProduct);
    
    return products;
  } catch (error) {
    console.error('Error fetching data package products:', error);
    throw error;
  }
};

// Transaction Processing
type TransactionRequest = {
  product_code: string;
  customer_id: string;
  callback_url?: string;
  reference_id: string;
  type: 'mobile-credit' | 'electricity' | 'data-package';
};

type TransactionResponse = {
  transaction_id: string;
  reference_id: string;
  customer_id: string;
  product: {
    code: string;
    name: string;
  };
  amount: number;
  qr_string: string;
  expiry_time: string; // ISO date string
  status: 'pending';
};

export const processTransaction = async (data: TransactionRequest): Promise<TransactionResponse> => {
  try {
    // In DEV environment, we can use a mock API response
    if (import.meta.env.DEV && !import.meta.env.VITE_USE_DIGIFLAZZ) {
      console.log('Using mock Digiflazz API response for transaction processing', data);
      
      // Mock QR code string
      const mockQrString = `00020101021226570014A00000007750415530303611012345678901520400005303360540${data.product_code}5802ID5920Sample Merchant Name6013JAKARTA PUSAT6105101166304A69A`;
      
      // Mock transaction response
      return {
        transaction_id: `TRX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        reference_id: data.reference_id,
        customer_id: data.customer_id,
        product: {
          code: data.product_code,
          name: `Product ${data.product_code}`
        },
        amount: 10000, // Mock amount
        qr_string: mockQrString,
        expiry_time: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
        status: 'pending'
      };
    }
    
    const response = await makeApiRequest('transaction', {
      buyer_sku_code: data.product_code,
      customer_no: data.customer_id,
      ref_id: data.reference_id,
      ...(data.callback_url && { callback_url: data.callback_url })
    });
    
    const result = response.data.data;
    
    return {
      transaction_id: result.trx_id,
      reference_id: result.ref_id,
      customer_id: data.customer_id,
      product: {
        code: data.product_code,
        name: result.product_name || `Product ${data.product_code}`
      },
      amount: parseFloat(result.price),
      qr_string: result.qr_string || 'mock-qr-string',
      expiry_time: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      status: 'pending'
    };
  } catch (error) {
    console.error('Error processing transaction with Digiflazz:', error);
    throw error;
  }
};

// Check transaction status
type TransactionStatusResponse = {
  transaction_id: string;
  reference_id: string;
  status: 'success' | 'pending' | 'failed';
  updated_at: string;
  details?: {
    serial_number?: string;
    token?: string;
    message?: string;
  };
};

export const checkTransactionStatus = async (transactionId: string): Promise<TransactionStatusResponse> => {
  try {
    // In DEV environment, we can use a mock API response
    if (import.meta.env.DEV && !import.meta.env.VITE_USE_DIGIFLAZZ) {
      console.log('Using mock Digiflazz API response for transaction status check', transactionId);
      
      // Randomly decide status for demo purposes
      const statusOptions = ['success', 'pending', 'failed'] as const;
      const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      
      let details;
      if (randomStatus === 'success') {
        details = {
          serial_number: `SN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          token: Math.random().toString(36).substring(2, 10).toUpperCase(),
          message: 'Transaction completed successfully'
        };
      } else if (randomStatus === 'failed') {
        details = {
          message: 'Payment verification failed'
        };
      }
      
      return {
        transaction_id: transactionId,
        reference_id: `REF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        status: randomStatus,
        updated_at: new Date().toISOString(),
        details
      };
    }
    
    const response = await makeApiRequest('transaction-status', { trx_id: transactionId });
    const result = response.data.data;
    
    // Map Digiflazz status to our status format
    let status: 'success' | 'pending' | 'failed';
    switch (result.status) {
      case 'Sukses':
        status = 'success';
        break;
      case 'Pending':
        status = 'pending';
        break;
      default:
        status = 'failed';
    }
    
    return {
      transaction_id: result.trx_id,
      reference_id: result.ref_id,
      status,
      updated_at: new Date().toISOString(),
      details: {
        serial_number: result.sn,
        message: result.message
      }
    };
  } catch (error) {
    console.error('Error checking transaction status with Digiflazz:', error);
    throw error;
  }
};

export default {
  getMobileCreditProducts,
  getElectricityProducts,
  getDataPackageProducts,
  processTransaction,
  checkTransactionStatus
};
