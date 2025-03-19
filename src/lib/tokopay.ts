import axios from 'axios';

// TokoPay API configuration from environment variables
const API_URL = import.meta.env.VITE_TOKOPAY_API_URL || 'https://api.tokopay.id/v1';
const MERCHANT_ID = import.meta.env.VITE_TOKOPAY_MERCHANT_ID;
const SECRET = import.meta.env.VITE_TOKOPAY_SECRET;

// Validate required environment variables
if (!MERCHANT_ID || !SECRET) {
  console.warn('TokoPay credentials not found in environment variables');
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
    // In DEV environment, we can still use a mock API response for testing
    if (import.meta.env.DEV && !import.meta.env.VITE_USE_TOKOPAY) {
      console.log('Using mock TokoPay API response for payment processing', data);
      
      // Mock QR code string
      const mockQrString = `00020101021226570014A00000007750415530303611012345678901520400005303360540${data.ref_id}5802ID5920TokoPay Merchant6013JAKARTA PUSAT6105101166304A69A`;
      
      // Mock payment response with the new structure
      return {
        status: "Success",
        data: {
          other: "",
          panduan_pembayaran: "",
          pay_url: `https://tokopay.id/payment/${data.ref_id}`,
          qr_link: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mockQrString)}`,
          qr_string: mockQrString,
          total_bayar: data.nominal,
          total_diterima: data.nominal * 0.99, // Simulate a small fee
          trx_id: `TP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
        }
      };
    }
    
    // Build the API URL with query parameters for the real API call
    const url = `${API_URL}?merchant=${MERCHANT_ID}&secret=${SECRET}&ref_id=${data.ref_id}&nominal=${data.nominal}&metode=${data.metode}`;
    
    const response = await axios.get(url);
    
    return response.data;
  } catch (error) {
    console.error('Error creating payment order with TokoPay:', error);
    throw error;
  }
};

export const checkPaymentStatus = async (ref_id: string): Promise<any> => {
  try {
    // In DEV environment, we can use a mock API response
    if (import.meta.env.DEV && !import.meta.env.VITE_USE_TOKOPAY) {
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
    
    // Build the status check URL for the real API
    const url = `https://api.tokopay.id/v1/status?merchant=${MERCHANT_ID}&secret=${SECRET}&ref_id=${ref_id}`;
    
    const response = await axios.get(url);
    
    return response.data;
  } catch (error) {
    console.error('Error checking payment status with TokoPay:', error);
    throw error;
  }
};

export default {
  createPaymentOrder,
  checkPaymentStatus
};
