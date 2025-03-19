
// Types
export type PriceType = {
  basePrice: number;
  sellingPrice: number;
};

export type MobileCreditProduct = {
  product_code: string;
  operator: string;
  description: string;
  amount: number;
  price: PriceType;
};

export type ElectricityProduct = {
  product_code: string;
  description: string;
  amount: number;
  price: PriceType;
};

export type DataPackageProduct = {
  product_code: string;
  operator: string;
  description: string;
  details: string;
  price: PriceType;
};

// Export functions from supabaseProducts.ts
export {
  getMobileCreditProducts,
  getElectricityProducts,
  getDataPackageProducts,
  syncProductsWithDigiflazz // Export the new sync function
} from './supabaseProducts';

// Keep processTransaction and checkTransactionStatus from digiflazz
export {
  processTransaction,
  checkTransactionStatus
} from './digiflazz';
