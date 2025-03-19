
import axios from 'axios';
import { PriceType, MobileCreditProduct, ElectricityProduct, DataPackageProduct } from './api';
import CryptoJS from 'crypto-js';

// Digiflazz API URL
const API_URL = 'https://api.digiflazz.com/v1';

// Default profit margins in percentage
const DEFAULT_MARGINS = {
  'mobile-credit': 5,  // 5% margin for mobile credits
  'electricity': 3,    // 3% margin for electricity
  'data-package': 7,   // 7% margin for data packages
};

// API credentials
// In a real app, these should be stored in environment variables
const USERNAME = 'foxepoWjxJqo';
const DEV_API_KEY = 'dev-ac3455b0-ab16-11ec-bca1-e58e09781976';
const PROD_API_KEY = 'e3dce8f6-2a22-5985-b8ef-dd10d81c704a';
// Force using DEV_API_KEY as default
const API_KEY = DEV_API_KEY;

// Create signature for API requests using MD5 hash from crypto-js
const createSignature = (username: string, key: string, action: string): string => {
  try {
    // Create MD5 hash of username + key + action
    const signatureString = username + key + action;
    const signature = CryptoJS.MD5(signatureString).toString();
    console.log('Creating signature with:', { username, key, action });
    console.log('Signature string:', signatureString);
    console.log('Generated signature:', signature);
    return signature;
  } catch (error) {
    console.error('Error creating signature:', error);
    // Fallback for environments where crypto might not be available
    return `${username}${new Date().getTime()}`;
  }
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

// Get price list from Digiflazz API
export const getPriceList = async () => {
  try {
    // In DEV environment, we can use a mock API or the real one
    if (import.meta.env.DEV && !import.meta.env.VITE_USE_DIGIFLAZZ) {
      console.log('Using mock Digiflazz API response for price list');
      // Return mock data or fetch from a local JSON file
      return import('./mockPriceList.json');
    }
    
    // Create the signature using the correct format: MD5(USERNAME + API_KEY + "pricelist")
    // Always use DEV_API_KEY for signature calculation
    const signature = createSignature(USERNAME, DEV_API_KEY, "pricelist");
    console.log('Generated signature for pricelist:', signature);
    console.log('Using username:', USERNAME);
    console.log('Using API key:', DEV_API_KEY);
    
    const payload = {
      cmd: 'prepaid',
      username: USERNAME,
      sign: signature
    };
    
    console.log('Sending payload to Digiflazz:', payload);
    
    const response = await axios.post(`${API_URL}/price-list`, payload);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching price list from Digiflazz:', error);
    throw error;
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
    
    // Create signature for transaction
    const signature = createSignature(USERNAME, API_KEY, "topup");
    
    // Prepare the request body based on the product type
    const requestBody = {
      username: USERNAME,
      sign: signature,
      buyer_sku_code: data.product_code,
      customer_no: data.customer_id,
      ref_id: data.reference_id,
      ...(data.callback_url && { callback_url: data.callback_url })
    };
    
    const response = await axios.post(`${API_URL}/transaction`, requestBody);
    
    // Transform the API response to match our expected format
    // Note: This transformation would depend on the actual Digiflazz API response structure
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
      qr_string: result.qr_string || 'mock-qr-string', // Digiflazz might not provide QR strings directly
      expiry_time: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // Set a standard expiry time
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
    
    // Create signature for status check
    const signature = createSignature(USERNAME, API_KEY, "checkstatus");
    
    const response = await axios.post(`${API_URL}/transaction`, {
      username: USERNAME,
      sign: signature,
      trx_id: transactionId
    });
    
    // Transform the API response to match our expected format
    // Note: This transformation would depend on the actual Digiflazz API response structure
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
