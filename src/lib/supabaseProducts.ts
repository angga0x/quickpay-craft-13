
import { supabase } from "@/integrations/supabase/client";
import mockPriceList from './mockPriceList.json';

export type PriceType = {
  basePrice: number;
  sellingPrice: number;
};

export type Product = {
  id: string;
  type: 'mobile-credit' | 'electricity' | 'data-package';
  name: string;
  operator?: string;
  description: string;
  amount?: number;
  details?: string;
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

// Helper function to initialize products in Supabase from mock data
export const initializeProducts = async () => {
  try {
    // Check if products already exist
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    
    // If we already have products, don't re-initialize
    if (count && count > 0) {
      console.log(`Products already initialized (${count} products found)`);
      return true;
    }
    
    console.log('Initializing products from mock data...');
    
    // Mobile Credit Products - adapt from mockPriceList format
    const mobileCreditProducts = mockPriceList.data
      .filter(item => item.category === "Pulsa")
      .map(item => ({
        id: item.buyer_sku_code,
        type: 'mobile-credit' as const,
        name: item.product_name,
        operator: item.brand,
        description: `${item.brand} Credit`,
        amount: parseInt(item.price, 10),
        base_price: parseInt(item.price, 10) - 1000, // Adjust as needed
        selling_price: parseInt(item.price, 10),
        active: true
      }));
    
    // Electricity Products - adapt from mockPriceList format
    const electricityProducts = mockPriceList.data
      .filter(item => item.category === "PLN")
      .map(item => ({
        id: item.buyer_sku_code,
        type: 'electricity' as const,
        name: item.product_name,
        description: 'PLN Prepaid Token',
        amount: parseInt(item.price, 10),
        base_price: parseInt(item.price, 10) - 2000, // Adjust as needed
        selling_price: parseInt(item.price, 10),
        active: true
      }));
    
    // Data Package Products - adapt from mockPriceList format
    const dataPackageProducts = mockPriceList.data
      .filter(item => item.category === "Data")
      .map(item => ({
        id: item.buyer_sku_code,
        type: 'data-package' as const,
        name: item.product_name,
        operator: item.brand,
        description: `${item.brand} Data Package`,
        details: item.desc || item.product_name,
        base_price: parseInt(item.price, 10) - 1500, // Adjust as needed
        selling_price: parseInt(item.price, 10),
        active: true
      }));
    
    // Combine all products
    const allProducts = [...mobileCreditProducts, ...electricityProducts, ...dataPackageProducts];
    
    // Insert products into Supabase
    const { error } = await supabase
      .from('products')
      .insert(allProducts);
    
    if (error) throw error;
    
    console.log(`Successfully initialized ${allProducts.length} products`);
    return true;
  } catch (error) {
    console.error('Error initializing products:', error);
    return false;
  }
};

// Get mobile credit products
export const getMobileCreditProducts = async (): Promise<MobileCreditProduct[]> => {
  try {
    // Initialize products if needed
    await initializeProducts();
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('type', 'mobile-credit')
      .eq('active', true);
    
    if (error) throw error;
    
    return (data || []).map(item => ({
      product_code: item.id,
      operator: item.operator || '',
      description: item.name,
      amount: item.amount || 0,
      price: {
        basePrice: item.base_price,
        sellingPrice: item.selling_price
      }
    }));
  } catch (error) {
    console.error('Error fetching mobile credit products:', error);
    // Fallback to mock data in case of error
    return mockPriceList.data
      .filter(item => item.category === "Pulsa")
      .map(item => ({
        product_code: item.buyer_sku_code,
        operator: item.brand,
        description: item.product_name,
        amount: parseInt(item.price, 10),
        price: {
          basePrice: parseInt(item.price, 10) - 1000,
          sellingPrice: parseInt(item.price, 10)
        }
      }));
  }
};

// Get electricity products
export const getElectricityProducts = async (): Promise<ElectricityProduct[]> => {
  try {
    // Initialize products if needed
    await initializeProducts();
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('type', 'electricity')
      .eq('active', true);
    
    if (error) throw error;
    
    return (data || []).map(item => ({
      product_code: item.id,
      description: item.name,
      amount: item.amount || 0,
      price: {
        basePrice: item.base_price,
        sellingPrice: item.selling_price
      }
    }));
  } catch (error) {
    console.error('Error fetching electricity products:', error);
    // Fallback to mock data in case of error
    return mockPriceList.data
      .filter(item => item.category === "PLN")
      .map(item => ({
        product_code: item.buyer_sku_code,
        description: item.product_name,
        amount: parseInt(item.price, 10),
        price: {
          basePrice: parseInt(item.price, 10) - 2000,
          sellingPrice: parseInt(item.price, 10)
        }
      }));
  }
};

// Get data package products
export const getDataPackageProducts = async (): Promise<DataPackageProduct[]> => {
  try {
    // Initialize products if needed
    await initializeProducts();
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('type', 'data-package')
      .eq('active', true);
    
    if (error) throw error;
    
    return (data || []).map(item => ({
      product_code: item.id,
      operator: item.operator || '',
      description: item.name,
      details: String(item.details || ''),
      price: {
        basePrice: item.base_price,
        sellingPrice: item.selling_price
      }
    }));
  } catch (error) {
    console.error('Error fetching data package products:', error);
    // Fallback to mock data in case of error
    return mockPriceList.data
      .filter(item => item.category === "Data")
      .map(item => ({
        product_code: item.buyer_sku_code,
        operator: item.brand,
        description: item.product_name,
        details: String(item.desc || item.product_name),
        price: {
          basePrice: parseInt(item.price, 10) - 1500,
          sellingPrice: parseInt(item.price, 10)
        }
      }));
  }
};
