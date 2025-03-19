
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Radio, ArrowLeft, RefreshCw } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import SearchInput from '@/components/ui-custom/SearchInput';
import ProductCard, { Product } from '@/components/ui-custom/ProductCard';
import PageTransition, { SlideUp } from '@/components/ui-custom/TransitionEffect';
import { getDataPackageProducts } from '@/lib/api';
import { useTransactionStore } from '@/store/transactionStore';
import { useToast } from '@/hooks/use-toast';

const formatPhone = (value: string) => {
  if (!value) return value;
  
  // Remove all non-digit characters
  const phoneNumber = value.replace(/\D/g, '');
  
  // Format: 0812-3456-7890
  const match = phoneNumber.match(/^(\d{0,4})(\d{0,4})(\d{0,4})$/);
  if (!match) return phoneNumber;
  
  // Only add dash if there are digits in the group
  const parts = [match[1], match[2], match[3]].filter(Boolean);
  return parts.join('-');
};

const DataPackage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [operator, setOperator] = useState<string>('all');
  const [phoneNumber, setPhoneNumber] = useState('');
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
      const response = await getDataPackageProducts();
      
      // Map API response to our Product type
      const mappedProducts = response.map(item => ({
        id: item.product_code,
        name: item.description,
        description: `${item.operator} Data Package`,
        price: item.price.sellingPrice,
        basePrice: item.price.basePrice,
        type: 'data-package' as const,
        details: [
          {
            label: 'Operator',
            value: item.operator
          },
          {
            label: 'Validity',
            value: item.details
          }
        ]
      }));
      
      setProducts(mappedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Failed to load products',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter products based on search and operator selection
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesOperator = operator === 'all' || 
                          (product.details?.[0]?.value || '').toLowerCase() === operator.toLowerCase();
    
    return matchesSearch && matchesOperator;
  });
  
  // Get unique operators for the filter dropdown
  const operators = ['all', ...new Set(products.map(p => p.details?.[0]?.value || '').filter(Boolean))];
  
  // Handle phone number input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatPhone(e.target.value);
    setPhoneNumber(formattedPhone);
  };
  
  // Check if phone number is valid
  const isPhoneValid = phoneNumber.replace(/\D/g, '').length >= 10;
  
  // Handle product selection
  const handleSelectProduct = (product: Product) => {
    selectProduct(product);
  };
  
  // Handle continue to checkout
  const handleContinue = () => {
    if (!selectedProduct || !isPhoneValid) return;
    
    // Save customer info to store
    setCustomerInfo({ phoneNumber });
    
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
            <h1 className="text-2xl font-medium">Data Package</h1>
            <p className="text-sm text-muted-foreground">
              Purchase internet data packages
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
                    placeholder="Search data package..." 
                    value={searchTerm} 
                    onChange={setSearchTerm}
                    className="w-full sm:w-60"
                  />
                  
                  <div className="flex items-center gap-2">
                    <Label htmlFor="operator-filter" className="whitespace-nowrap text-sm">
                      Operator:
                    </Label>
                    <Select value={operator} onValueChange={setOperator}>
                      <SelectTrigger id="operator-filter" className="w-full sm:w-36">
                        <SelectValue placeholder="All Operators" />
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map((op, index) => (
                          <SelectItem key={index} value={op}>
                            {op === 'all' ? 'All Operators' : op}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
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
                    <p className="text-muted-foreground">No packages found matching your criteria</p>
                    <Button 
                      variant="link" 
                      onClick={() => { 
                        setSearchTerm(''); 
                        setOperator('all'); 
                      }}
                    >
                      Reset filters
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                      <Radio className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">Customer Details</h3>
                      <p className="text-xs text-muted-foreground">Enter recipient phone number</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone-number">Phone Number</Label>
                      <Input 
                        id="phone-number"
                        placeholder="0812-3456-7890"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        className={`${!isPhoneValid && phoneNumber ? 'border-red-300 focus-visible:ring-red-400' : ''}`}
                      />
                      {!isPhoneValid && phoneNumber && (
                        <p className="text-xs text-red-500">Please enter a valid phone number</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </SlideUp>
            
            <SlideUp>
              <Button 
                className="w-full"
                size="lg"
                disabled={!selectedProduct || !isPhoneValid}
                onClick={handleContinue}
              >
                Continue to Checkout
              </Button>
            </SlideUp>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default DataPackage;
