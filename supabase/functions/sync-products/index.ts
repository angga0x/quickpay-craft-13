// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/deploy_node_server
// Learn more at https://deno.land/manual/runtime/workers

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { Database } from '../_shared/database.types.ts';
import axios from 'https://esm.sh/axios@1.6.2';
import { hmac } from 'https://deno.land/x/hmac@v2.0.1/mod.ts';

// Digiflazz API URL
const API_URL = 'https://api.digiflazz.com/v1';

// API credentials
const USERNAME = 'foxepoWjxJqo';
const API_KEY = 'dev-ac3455b0-ab16-11ec-bca1-e58e09781976';

// Create signature for API requests using HMAC
const createSignature = (username: string, key: string, action: string): string => {
  try {
    const signatureString = username + key + action;
    const hash = hmac('md5', key, signatureString, 'utf8', 'hex');
    console.log('Generated signature:', hash);
    return hash;
  } catch (error) {
    console.error('Error creating signature:', error);
    return `${username}${Date.now()}`;
  }
};

// Get price list from Digiflazz API
const getPriceList = async () => {
  try {
    // Create the signature
    const signature = createSignature(USERNAME, API_KEY, "pricelist");
    
    const payload = {
      cmd: 'prepaid',
      username: USERNAME,
      sign: signature
    };
    
    console.log('Sending payload to Digiflazz:', payload);
    
    const response = await axios.post(`${API_URL}/price-list`, payload);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching price list from Digiflazz:', error);
    throw error;
  }
};

Deno.serve(async (req) => {
  try {
    // Get Supabase URL and key from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    // Create Supabase client
    const supabase = createClient<Database>(supabaseUrl, supabaseKey);
    
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
    
    return new Response(
      JSON.stringify({
        message: 'Products synchronized successfully',
        stats
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in sync-products function:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to synchronize products',
        message: error.message
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
