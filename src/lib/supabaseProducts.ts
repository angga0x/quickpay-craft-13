import { supabase } from "@/integrations/supabase/client";
import mockPriceList from './mockPriceList.json';
import { getPriceList } from './digiflazz';

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

// Sync products with Digiflazz API and update the Supabase database
export const syncProductsWithDigiflazz = async (): Promise<{
  added: number;
  updated: number;
  unchanged: number;
  errors: number;
}> => {
  try {
    console.log('Starting products synchronization with Digiflazz...');
    
    // Get all existing products from Supabase
    const { data: existingProducts, error: fetchError } = await supabase
      .from('products')
      .select('*');
    
    if (fetchError) throw fetchError;
    
    // Create a map of existing products by ID for faster lookup
    const existingProductsMap = new Map();
    existingProducts?.forEach(product => {
      existingProductsMap.set(product.id, product);
    });
    
    console.log(`Found ${existingProductsMap.size} existing products in Supabase`);
    
    // Fetch the latest price list from Digiflazz API
    const priceList = await getPriceList();
    const apiProducts = priceList.data || [];
    
    console.log(`Fetched ${apiProducts.length} products from Digiflazz API`);
    
    // Track statistics
    let stats = {
      added: 0,
      updated: 0,
      unchanged: 0,
      errors: 0
    };
    
    // Process products in batches to avoid overwhelming the database
    const batchSize = 20;
    const batches = Math.ceil(apiProducts.length / batchSize);
    
    for (let i = 0; i < batches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, apiProducts.length);
      const batch = apiProducts.slice(start, end);
      
      console.log(`Processing batch ${i + 1}/${batches} (${batch.length} products)`);
      
      // Process each product in the current batch
      const batchPromises = batch.map(async (item) => {
        try {
          const productId = item.buyer_sku_code;
          const existingProduct = existingProductsMap.get(productId);
          
          // Skip products that are not active
          if (!item.buyer_product_status) {
            return;
          }
          
          // Determine product type
          let productType;
          if (item.category === 'Pulsa') {
            productType = 'mobile-credit';
          } else if (item.category === 'PLN') {
            productType = 'electricity';
          } else if (item.category === 'Data') {
            productType = 'data-package';
          } else {
            // Skip products that don't fit our categories
            return;
          }
          
          // Parse price to ensure it's a number
          const itemPrice = parseInt(item.price, 10);
          if (isNaN(itemPrice)) {
            console.warn(`Skipping product with invalid price: ${item.product_name}`);
            return;
          }
          
          // Determine base price with a simple formula
          // In a real app, this might come from the API or a more complex calculation
          let basePrice;
          if (productType === 'mobile-credit') {
            basePrice = itemPrice - 1000;  // 1000 IDR margin for mobile credits
          } else if (productType === 'electricity') {
            basePrice = itemPrice - 2000;  // 2000 IDR margin for electricity
          } else {
            basePrice = itemPrice - 1500;  // 1500 IDR margin for data packages
          }
          
          // Ensure base price is not negative
          basePrice = Math.max(basePrice, itemPrice * 0.95);
          
          // Create the product object
          const productData = {
            id: productId,
            type: productType,
            name: item.product_name,
            operator: item.brand,
            description: item.category === 'PLN' ? 'PLN Prepaid Token' : `${item.brand} ${item.category}`,
            amount: productType === 'mobile-credit' ? parseInt(item.product_name.replace(/[^0-9]/g, '')) || itemPrice : itemPrice,
            details: item.desc || item.product_name,
            base_price: basePrice,
            selling_price: itemPrice,
            active: true
          };
          
          if (existingProduct) {
            // Check if any fields need updating
            if (
              existingProduct.name !== productData.name ||
              existingProduct.base_price !== productData.base_price ||
              existingProduct.selling_price !== productData.selling_price ||
              existingProduct.description !== productData.description ||
              existingProduct.details !== productData.details ||
              existingProduct.active !== productData.active
            ) {
              // Update the existing product
              const { error: updateError } = await supabase
                .from('products')
                .update({
                  name: productData.name,
                  description: productData.description,
                  operator: productData.operator,
                  amount: productData.amount,
                  details: productData.details,
                  base_price: productData.base_price,
                  selling_price: productData.selling_price,
                  active: true
                })
                .eq('id', productId);
              
              if (updateError) {
                console.error(`Error updating product ${productId}:`, updateError);
                stats.errors++;
              } else {
                console.log(`Updated product: ${productData.name}`);
                stats.updated++;
              }
            } else {
              // Product exists and is unchanged
              stats.unchanged++;
            }
          } else {
            // Insert new product
            const { error: insertError } = await supabase
              .from('products')
              .insert(productData);
            
            if (insertError) {
              console.error(`Error inserting product ${productId}:`, insertError);
              stats.errors++;
            } else {
              console.log(`Added new product: ${productData.name}`);
              stats.added++;
            }
          }
        } catch (error) {
          console.error('Error processing product:', error);
          stats.errors++;
        }
      });
      
      // Wait for all operations in the current batch to complete
      await Promise.all(batchPromises);
      console.log(`Completed batch ${i + 1}/${batches}`);
    }
    
    console.log('Product synchronization completed with stats:', stats);
    return stats;
  } catch (error) {
    console.error('Error syncing products with Digiflazz:', error);
    throw error;
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
