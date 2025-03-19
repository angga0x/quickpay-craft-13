import axios from 'axios';

// Backend API URL
const API_URL = 'http://localhost:3000/api';

// TokoPay API configuration from environment variables
const MERCHANT_ID = import.meta.env.TOKOPAY_MERCHANT_ID;
const SECRET = import.meta.env.TOKOPAY_SECRET;

// Validate required environment variables
if (!MERCHANT_ID || !SECRET) {
  console.warn('TokoPay credentials not found in environment variables. Using mock data in development mode.');
}

type TokopayOrderRequest = {
  ref_id: string;
  nominal: number;
  metode: string;
};

// Updated to match the actual API response structure
type TokopayOrderResponse = {
  status: string;
  data: {
    other: string;
    panduan_pembayaran: string;
    pay_url: string;
    qr_link: string;
    qr_string: string;
    total_bayar: number;
    total_diterima: number;
    trx_id: string;
  };
};

export const createPaymentOrder = async (data: TokopayOrderRequest): Promise<TokopayOrderResponse> => {
  try {
    // In DEV environment without backend, use mock response
    if (import.meta.env.DEV && !import.meta.env.VITE_USE_BACKEND) {
      console.log('Using mock TokoPay API response for payment processing', data);
      
      // Mock QR code string
      const mockQrString = `00020101021226570014A00000007750415530303611012345678901520400005303360540${data.ref_id}5802ID5920TokoPay Merchant6013JAKARTA PUSAT6105101166304A69A`;
      
      // Mock payment response
      return {
        status: "Success",
        data: {
          other: "",
          panduan_pembayaran: "",
          pay_url: `https://tokopay.id/payment/${data.ref_id}`,
          qr_link: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mockQrString)}`,
          qr_string: mockQrString,
          total_bayar: data.nominal,
          total_diterima: data.nominal * 0.99,
          trx_id: `TP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
        }
      };
    }
    
    // Call backend proxy
    const response = await axios.post(`${API_URL}/payment/create`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating payment order:', error);
    throw error;
  }
};

export const checkPaymentStatus = async (ref_id: string): Promise<any> => {
  try {
    // In DEV environment without backend, use mock response
    if (import.meta.env.DEV && !import.meta.env.VITE_USE_BACKEND) {
      console.log('Using mock TokoPay API response for payment status check', ref_id);
      
      // Randomly decide status for demo purposes
      const statusOptions = ['SUCCESS', 'PENDING', 'FAILED'];
      const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      
      return {
        status: "Success",
        data: {
          ref_id: ref_id,
          status: randomStatus,
          payment_time: randomStatus === 'SUCCESS' ? new Date().toISOString() : null
        }
      };
    }
    
    // Call backend proxy
    const response = await axios.post(`${API_URL}/payment/status`, { ref_id });
    return response.data;
  } catch (error) {
    console.error('Error checking payment status:', error);
    throw error;
  }
};

export default {
  createPaymentOrder,
  checkPaymentStatus
};
