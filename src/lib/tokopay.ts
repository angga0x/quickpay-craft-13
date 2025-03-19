
import axios from 'axios';

// TokoPay API URL
const API_URL = 'https://api.tokopay.id/v1/order';

// API credentials
// In a real app, these should be stored in environment variables
const MERCHANT_ID = import.meta.env.VITE_TOKOPAY_MERCHANT_ID || 'demo';
const SECRET = import.meta.env.VITE_TOKOPAY_SECRET || 'demo-secret';

type TokopayOrderRequest = {
  ref_id: string;
  nominal: number;
  metode: string;
};

type TokopayOrderResponse = {
  status: boolean;
  message: string;
  data: {
    order_id: string;
    ref_id: string;
    nominal: number;
    metode: string;
    payment_name: string;
    payment_code: string;
    payment_url: string;
    qr_string: string;
    expired_time: string; // ISO date string
  };
};

export const createPaymentOrder = async (data: TokopayOrderRequest): Promise<TokopayOrderResponse> => {
  try {
    // In DEV environment, we can use a mock API response
    if (import.meta.env.DEV && !import.meta.env.VITE_USE_TOKOPAY) {
      console.log('Using mock TokoPay API response for payment processing', data);
      
      // Mock QR code string
      const mockQrString = `00020101021226570014A00000007750415530303611012345678901520400005303360540${data.ref_id}5802ID5920TokoPay Merchant6013JAKARTA PUSAT6105101166304A69A`;
      
      // Mock payment response
      return {
        status: true,
        message: 'Success',
        data: {
          order_id: `ORD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          ref_id: data.ref_id,
          nominal: data.nominal,
          metode: data.metode,
          payment_name: 'QRIS',
          payment_code: mockQrString,
          payment_url: `https://tokopay.id/payment/${data.ref_id}`,
          qr_string: mockQrString,
          expired_time: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
        }
      };
    }
    
    // Build the API URL with query parameters
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
        status: true,
        message: 'Success',
        data: {
          ref_id: ref_id,
          status: randomStatus,
          payment_time: randomStatus === 'SUCCESS' ? new Date().toISOString() : null
        }
      };
    }
    
    // Build the status check URL
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
