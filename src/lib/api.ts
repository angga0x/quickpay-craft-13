
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

// Export functions directly from digiflazz.ts
export {
  getMobileCreditProducts,
  getElectricityProducts,
  getDataPackageProducts,
  processTransaction,
  checkTransactionStatus
} from './digiflazz';
