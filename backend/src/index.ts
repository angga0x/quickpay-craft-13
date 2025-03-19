import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import CryptoJS from 'crypto-js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4173',
  credentials: true
}));

// Create signature for API requests
const createSignature = (username: string, key: string, action: string): string => {
  try {
    const signatureString = username + key + action;
    return CryptoJS.MD5(signatureString).toString();
  } catch (error) {
    console.error('Error creating signature:', error);
    throw new Error('Failed to create signature');
  }
};

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
    const { product_code, customer_id, reference_id, callback_url } = req.body;

    const signature = createSignature(
      process.env.DIGIFLAZZ_USERNAME!,
      process.env.DIGIFLAZZ_DEV_KEY!,
      'topup'
    );

    const payload = {
      username: process.env.DIGIFLAZZ_USERNAME,
      sign: signature,
      buyer_sku_code: product_code,
      customer_no: customer_id,
      ref_id: reference_id,
      ...(callback_url && { callback_url })
    };

    const response = await axios.post(`${process.env.DIGIFLAZZ_URL}/transaction`, payload);
    res.json(response.data);
  } catch (error) {
    console.error('Error processing transaction:', error);
    res.status(500).json({ error: 'Failed to process transaction' });
  }
});

// Proxy route for transaction status
app.post('/api/transaction/status', async (req: Request, res: Response) => {
  try {
    const { trx_id } = req.body;

    const signature = createSignature(
      process.env.DIGIFLAZZ_USERNAME!,
      process.env.DIGIFLAZZ_DEV_KEY!,
      'checkstatus'
    );

    const payload = {
      username: process.env.DIGIFLAZZ_USERNAME,
      sign: signature,
      trx_id
    };

    const response = await axios.post(`${process.env.DIGIFLAZZ_URL}/transaction`, payload);
    res.json(response.data);
  } catch (error) {
    console.error('Error checking transaction status:', error);
    res.status(500).json({ error: 'Failed to check transaction status' });
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