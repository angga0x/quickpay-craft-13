
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

// Re-export functions from digiflazz.ts to maintain backward compatibility
export {
  getMobileCreditProducts,
  getElectricityProducts,
  getDataPackageProducts,
  processTransaction,
  checkTransactionStatus
} from './digiflazz';
