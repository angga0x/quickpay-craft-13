import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, ArrowLeft, RefreshCw } from 'lucide-react';
import SearchInput from '@/components/ui-custom/SearchInput';
import ProductCard, { Product } from '@/components/ui-custom/ProductCard';
import PageTransition, { SlideUp } from '@/components/ui-custom/TransitionEffect';
import { getElectricityProducts } from '@/lib/api';
import { useTransactionStore } from '@/store/transactionStore';
import { useToast } from '@/hooks/use-toast';

const formatMeterNumber = (value: string) => {
  if (!value) return value;
  
  // Remove all non-digit characters
  const meterNumber = value.replace(/\D/g, '');
  
  // Format: 1234-5678-9012
  const match = meterNumber.match(/^(\d{0,4})(\d{0,4})(\d{0,4})$/);
  if (!match) return meterNumber;
  
  // Only add dash if there are digits in the group
  const parts = [match[1], match[2], match[3]].filter(Boolean);
  return parts.join('-');
};

const ElectricityToken = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  
  const { 
    selectedProduct, 
    selectProduct,
    setCustomerInfo 
  } = useTransactionStore();
  
  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);
  
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await getElectricityProducts();
      
      // Map API response to our Product type
      const mappedProducts = response.map(item => ({
        id: item.product_code,
        name: item.description,
        description: 'PLN Prepaid Token',
        price: item.price.sellingPrice,
        basePrice: item.price.basePrice,
        type: 'electricity' as const,
        details: [
          {
            label: 'Token Value',
            value: `Rp${item.amount.toLocaleString('id-ID')}`
          }
        ]
      }));
      
      setProducts(mappedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Gagal memuat produk',
        description: 'Silakan coba lagi nanti',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter products based on search
  const filteredProducts = products.filter(product => {
    return product.name.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  // Handle meter number input
  const handleMeterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedMeter = formatMeterNumber(e.target.value);
    setMeterNumber(formattedMeter);
    
    // Simulate customer validation
    if (formattedMeter.replace(/\D/g, '').length >= 11) {
      // In a real app, this would be an API call to validate the meter number
      setCustomerName('John Doe');
    } else {
      setCustomerName('');
    }
  };
  
  // Check if form is valid
  const isMeterValid = meterNumber.replace(/\D/g, '').length >= 11;
  const isFormValid = isMeterValid && customerName && selectedProduct;
  
  // Handle product selection
  const handleSelectProduct = (product: Product) => {
    selectProduct(product);
  };
  
  // Handle continue to checkout
  const handleContinue = () => {
    if (!isFormValid) return;
    
    // Save customer info to store
    setCustomerInfo({ 
      phoneNumber: meterNumber,
      name: customerName
    });
    
    // Navigate to checkout
    navigate('/checkout');
  };
  
  return (
    <PageTransition>
      <div className="container max-w-5xl mx-auto px-6 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-medium">Token Listrik</h1>
            <p className="text-sm text-muted-foreground">
              Beli token listrik prabayar PLN
            </p>
          </div>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Products Column */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                {/* Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-6">
                  <SearchInput 
                    placeholder="Cari nominal token..." 
                    value={searchTerm} 
                    onChange={setSearchTerm}
                    className="w-full sm:w-60"
                  />
                  
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={fetchProducts}
                    disabled={isLoading}
                    className="ml-auto shrink-0"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                
                <Separator className="mb-6" />
                
                {/* Products Grid */}
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[...Array(6)].map((_, index) => (
                      <div key={index} className="h-36 rounded-lg loading-placeholder" />
                    ))}
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredProducts.map((product) => (
                      <ProductCard 
                        key={product.id}
                        product={product}
                        onClick={handleSelectProduct}
                        isSelected={selectedProduct?.id === product.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">Tidak ada token yang sesuai dengan pencarian Anda</p>
                    <Button 
                      variant="link" 
                      onClick={() => setSearchTerm('')}
                    >
                      Tampilkan semua token
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Customer Details Column */}
          <div className="space-y-6">
            <SlideUp>
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                      <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">Detail Pelanggan</h3>
                      <p className="text-xs text-muted-foreground">Masukkan informasi meteran Anda</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="meter-number">Nomor Meteran</Label>
                      <Input 
                        id="meter-number"
                        placeholder="1234-5678-9012"
                        value={meterNumber}
                        onChange={handleMeterChange}
                        className={`${!isMeterValid && meterNumber ? 'border-red-300 focus-visible:ring-red-400' : ''}`}
                      />
                      {!isMeterValid && meterNumber && (
                        <p className="text-xs text-red-500">Masukkan nomor meteran yang valid</p>
                      )}
                    </div>
                    
                    {customerName && (
                      <div className="p-3 bg-muted/50 rounded-md">
                        <p className="text-xs text-muted-foreground">Nama Pelanggan</p>
                        <p className="font-medium">{customerName}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </SlideUp>
            
            <SlideUp>
              <Button 
                className="w-full"
                size="lg"
                disabled={!isFormValid}
                onClick={handleContinue}
              >
                Lanjut ke Pembayaran
              </Button>
            </SlideUp>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default ElectricityToken;
