import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'http://localhost:4173'
    : true, // Allow all origins in development
  credentials: true
}));

// Create signature for API requests
const createSignature = (username: string, key: string, action: string): string => {
  try {
    let signatureString;
    if (action === 'topup') {
      // For topup, the signature is MD5(username + key + ref_id)
      signatureString = username + key + action;
    } else {
      // For other actions (pricelist, checkstatus)
      signatureString = username + key + action;
    }
    console.log('Creating signature with:', { username, key, action, signatureString });
    const signature = CryptoJS.MD5(signatureString).toString();
    console.log('Generated signature:', signature);
    return signature;
  } catch (error) {
    console.error('Error creating signature:', error);
    throw new Error('Failed to create signature');
  }
};

// Interface for Digiflazz payload
interface DigiflazzPayload {
  username: string | undefined;
  buyer_sku_code: string;
  customer_no: string;
  ref_id: string;
  sign: string;
  testing?: boolean;
  cb_url?: string;
}

// Proxy route for price list
app.post('/api/price-list', async (req: Request, res: Response) => {
  try {
    const signature = createSignature(
      process.env.DIGIFLAZZ_USERNAME!,
      process.env.DIGIFLAZZ_DEV_KEY!,
      'pricelist'
    );

    const payload = {
      cmd: 'prepaid',
      username: process.env.DIGIFLAZZ_USERNAME,
      sign: signature
    };

    console.log('Sending price-list request to Digiflazz:', payload);
    const response = await axios.post(`${process.env.DIGIFLAZZ_URL}/price-list`, payload);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching price list:', error);
    res.status(500).json({ error: 'Failed to fetch price list' });
  }
});

// Proxy route for transactions
app.post('/api/transaction', async (req: Request, res: Response) => {
  try {
    const { product_code, customer_id, ref_id } = req.body;

    // Validate required fields
    if (!product_code || !customer_id || !ref_id) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['product_code', 'customer_id', 'ref_id']
      });
    }

    // Create signature using ref_id
    const signature = createSignature(
      process.env.DIGIFLAZZ_USERNAME!,
      process.env.DIGIFLAZZ_DEV_KEY!,
      ref_id
    );

    // Format payload for Digiflazz (same format for both new transaction and status check)
    const payload: DigiflazzPayload = {
      username: process.env.DIGIFLAZZ_USERNAME,
      buyer_sku_code: product_code,
      customer_no: customer_id,
      ref_id,
      sign: signature
    };

    // Only add these fields for new transactions
    if (!req.query.check_status) {
      payload.testing = true;
      payload.cb_url = process.env.PUBLIC_URL 
        ? `${process.env.PUBLIC_URL}/api/callback/digiflazz`
        : 'http://localhost:3000/api/callback/digiflazz';
    }

    console.log(`Sending ${req.query.check_status ? 'status check' : 'transaction'} request to Digiflazz:`, {
      ...payload,
      sign: '***hidden***'
    });
    
    const response = await axios.post(`${process.env.DIGIFLAZZ_URL}/transaction`, payload);
    console.log('Digiflazz response:', response.data);
    
    res.json(response.data);
  } catch (error: any) {
    console.error('Error processing request:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to process request',
      details: error.response?.data || error.message
    });
  }
});

// Verify Digiflazz webhook signature
function verifyDigiflazzSignature(rawBody: Buffer, signature: string): boolean {
  const expectedSignature = 'sha1=' + crypto
    .createHmac('sha1', process.env.DIGIFLAZZ_DEV_KEY!)
    .update(rawBody)
    .digest('hex');
  
  console.log('Signature verification:', {
    received: signature,
    expected: expectedSignature,
    payload: rawBody.toString()
  });

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error comparing signatures:', error);
    return false;
  }
}

// Callback endpoint for Digiflazz transaction updates
app.post('/api/callback/digiflazz', express.json(), (req: Request, res: Response) => {
  try {
    console.log('Received webhook request:', {
      headers: req.headers,
      body: req.body
    });

    // Get the signature from headers
    const signature = req.headers['x-hub-signature'];
    const event = req.headers['x-digiflazz-event'];
    
    // Skip signature verification in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Skipping signature verification in development mode');
    } else {
      // Verify signature in production
      if (!signature || Array.isArray(signature)) {
        console.error('Missing or invalid signature');
        return res.status(400).json({ error: 'Missing signature' });
      }

      // Verify the payload signature using raw body
      const isValid = verifyDigiflazzSignature(
        Buffer.from(JSON.stringify(req.body)), // Convert body back to buffer
        signature
      );

      if (!isValid) {
        console.error('Invalid signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    // Validate payload structure
    if (!req.body.data || !req.body.data.ref_id) {
      console.error('Invalid payload structure:', req.body);
      return res.status(400).json({ error: 'Invalid payload structure' });
    }
    
    const { data } = req.body;
    console.log('Received Digiflazz webhook:', {
      event,
      ref_id: data.ref_id,
      status: data.status,
      message: data.message,
      sn: data.sn
    });

    // Send success response
    res.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ 
      error: 'Failed to process webhook',
      details: error.message
    });
  }
});

// Tokopay payment routes
app.post('/api/payment/create', async (req: Request, res: Response) => {
  try {
    const { ref_id, nominal, metode } = req.body;

    // Build the API URL with query parameters
    const url = `${process.env.TOKOPAY_API_URL}/order`;
    const params = {
      merchant: process.env.TOKOPAY_MERCHANT_ID,
      secret: process.env.TOKOPAY_SECRET,
      ref_id,
      nominal,
      metode
    };

    console.log('Creating payment order:', { ref_id, nominal, metode });
    const response = await axios.get(url, { params });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

app.post('/api/payment/status', async (req: Request, res: Response) => {
  try {
    const { ref_id } = req.body;

    // Build the API URL with query parameters
    const url = `${process.env.TOKOPAY_API_URL}/status`;
    const params = {
      merchant: process.env.TOKOPAY_MERCHANT_ID,
      secret: process.env.TOKOPAY_SECRET,
      ref_id
    };

    console.log('Checking payment status:', ref_id);
    const response = await axios.get(url, { params });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 