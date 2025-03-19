
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

// Constants
// Default profit margins in percentage
const DEFAULT_MARGINS = {
  'mobile-credit': 5,  // 5% margin for mobile credits
  'electricity': 3,    // 3% margin for electricity
  'data-package': 7,   // 7% margin for data packages
};

// Mock Data
const MOBILE_OPERATORS = ['Telkomsel', 'XL', 'Indosat', 'Tri', 'Smartfren'];
const DATA_PACKAGES = ['Internet Data 1GB', 'Internet Data 5GB', 'Internet Data 10GB', 'Internet Data Unlimited'];

// Utility Functions
const calculateSellingPrice = (basePrice: number, type: keyof typeof DEFAULT_MARGINS): number => {
  const margin = DEFAULT_MARGINS[type] / 100;
  return Math.ceil(basePrice * (1 + margin));
};

const generateMockProducts = <T>(
  count: number,
  generator: (index: number) => T
): T[] => {
  return Array.from({ length: count }, (_, index) => generator(index));
};

// Mock API functions
const getMobileCreditProducts = async (): Promise<MobileCreditProduct[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return generateMockProducts(15, (index) => {
    const operator = MOBILE_OPERATORS[index % MOBILE_OPERATORS.length];
    const amount = [5000, 10000, 20000, 25000, 50000, 100000][index % 6];
    const basePrice = amount * 0.98; // Base price is slightly less than face value
    
    return {
      product_code: `MC-${operator.substring(0, 3).toUpperCase()}-${amount}`,
      operator,
      description: `${operator} ${amount.toLocaleString('id-ID')}`,
      amount,
      price: {
        basePrice,
        sellingPrice: calculateSellingPrice(basePrice, 'mobile-credit')
      }
    };
  });
};

const getElectricityProducts = async (): Promise<ElectricityProduct[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return generateMockProducts(6, (index) => {
    const amounts = [20000, 50000, 100000, 200000, 500000, 1000000];
    const amount = amounts[index];
    const basePrice = amount * 0.99; // Base price is slightly less than face value
    
    return {
      product_code: `PLN-${amount}`,
      description: `Token Listrik ${amount.toLocaleString('id-ID')}`,
      amount,
      price: {
        basePrice,
        sellingPrice: calculateSellingPrice(basePrice, 'electricity')
      }
    };
  });
};

const getDataPackageProducts = async (): Promise<DataPackageProduct[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return generateMockProducts(12, (index) => {
    const operator = MOBILE_OPERATORS[index % MOBILE_OPERATORS.length];
    const packageName = DATA_PACKAGES[index % DATA_PACKAGES.length];
    const basePrice = [25000, 50000, 100000, 200000][index % 4];
    const validityDays = [7, 14, 30][index % 3];
    
    return {
      product_code: `DP-${operator.substring(0, 3).toUpperCase()}-${index}`,
      operator,
      description: `${packageName} - ${operator}`,
      details: `Valid for ${validityDays} days`,
      price: {
        basePrice,
        sellingPrice: calculateSellingPrice(basePrice, 'data-package')
      }
    };
  });
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

const processTransaction = async (data: TransactionRequest): Promise<TransactionResponse> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  const mockQrString = `00020101021226570014A00000007750415530303611012345678901520400005303360540${data.product_code}5802ID5920Sample Merchant Name6013JAKARTA PUSAT6105101166304A69A`;
  
  return {
    transaction_id: `TRX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    reference_id: data.reference_id,
    customer_id: data.customer_id,
    product: {
      code: data.product_code,
      name: getProductName(data.product_code, data.type)
    },
    amount: getProductAmount(data.product_code, data.type),
    qr_string: mockQrString,
    expiry_time: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
    status: 'pending'
  };
};

// Helper functions for transaction processing
const getProductName = (productCode: string, type: string): string => {
  // This would normally look up the product from a database or cache
  // For the mock API, we'll just generate a name based on the code
  switch (type) {
    case 'mobile-credit':
      return `Mobile Credit ${productCode.split('-')[2]}`;
    case 'electricity':
      return `Electricity Token ${productCode.split('-')[1]}`;
    case 'data-package':
      return `Data Package ${productCode.split('-')[1]}`;
    default:
      return productCode;
  }
};

const getProductAmount = (productCode: string, type: string): number => {
  // This would normally look up the product from a database or cache
  // For the mock API, we'll extract the amount from the product code
  try {
    switch (type) {
      case 'mobile-credit':
      case 'electricity':
        return parseInt(productCode.split('-').pop() || '0');
      case 'data-package':
        // For data packages, just use a standard amount since the code may not include it
        return [25000, 50000, 100000, 200000][parseInt(productCode.split('-').pop() || '0') % 4];
      default:
        return 0;
    }
  } catch (e) {
    console.error('Error parsing product code:', e);
    return 0;
  }
};

// Transaction Status
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

const checkTransactionStatus = async (transactionId: string): Promise<TransactionStatusResponse> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // Randomly decide status for demo purposes
  // In a real app, this would check with the payment gateway
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
};

export {
  getMobileCreditProducts,
  getElectricityProducts,
  getDataPackageProducts,
  processTransaction,
  checkTransactionStatus
};
