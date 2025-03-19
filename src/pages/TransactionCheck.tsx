
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Receipt, AlertCircle } from 'lucide-react';
import PageTransition, { SlideUp } from '@/components/ui-custom/TransitionEffect';
import { findTransactionByReference } from '@/lib/firebase';
import RecentTransactionCard, { Transaction } from '@/components/ui-custom/RecentTransactionCard';
import { useToast } from '@/hooks/use-toast';

const TransactionCheck = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reference, setReference] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<Transaction | null>(null);
  const [notFound, setNotFound] = useState(false);
  
  // Handle reference input change
  const handleReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReference(e.target.value);
    
    // Reset search state when input changes
    if (searchResult) setSearchResult(null);
    if (notFound) setNotFound(false);
  };
  
  // Handle search transaction
  const handleSearch = async () => {
    if (!reference.trim()) {
      toast({
        title: 'Please enter a reference',
        description: 'Enter transaction ID or reference ID',
        variant: 'default',
      });
      return;
    }
    
    try {
      setIsSearching(true);
      setSearchResult(null);
      setNotFound(false);
      
      if (import.meta.env.DEV) {
        // In development, return mock data or simulate not found
        setTimeout(() => {
          if (reference.includes('not-found')) {
            setNotFound(true);
          } else {
            setSearchResult(MOCK_TRANSACTION);
          }
          setIsSearching(false);
        }, 1000);
        return;
      }
      
      const result = await findTransactionByReference(reference.trim());
      
      if (result) {
        setSearchResult(result);
      } else {
        setNotFound(true);
        toast({
          title: 'Transaction not found',
          description: 'We could not find a transaction with this reference',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Error searching transaction:', error);
      toast({
        title: 'Search failed',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle view transaction details
  const handleViewTransaction = () => {
    if (searchResult) {
      navigate(`/transaction/${searchResult.id}`);
    }
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
            <h1 className="text-2xl font-medium">Check Transaction</h1>
            <p className="text-sm text-muted-foreground">
              Find transaction using reference or transaction ID
            </p>
          </div>
        </motion.div>
        
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Search Form */}
          <SlideUp>
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Receipt className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Transaction Lookup</h3>
                    <p className="text-xs text-muted-foreground">Enter reference ID or transaction ID</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      id="reference"
                      placeholder="Enter reference or transaction ID"
                      value={reference}
                      onChange={handleReferenceChange}
                      className="pr-10"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={handleSearch}
                    disabled={isSearching || !reference.trim()}
                  >
                    {isSearching ? 'Searching...' : 'Search Transaction'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </SlideUp>
          
          {/* Search Result */}
          {isSearching && (
            <div className="h-32 rounded-lg loading-placeholder" />
          )}
          
          {searchResult && (
            <SlideUp>
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Search Result</h3>
                <RecentTransactionCard 
                  transaction={searchResult}
                  onClick={handleViewTransaction}
                />
                <div className="flex justify-center">
                  <Button onClick={handleViewTransaction}>
                    View Details
                  </Button>
                </div>
              </div>
            </SlideUp>
          )}
          
          {notFound && (
            <SlideUp>
              <Card className="bg-muted/50">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  
                  <h3 className="text-lg font-medium mb-2">
                    No Transaction Found
                  </h3>
                  
                  <p className="text-muted-foreground mb-4">
                    We couldn't find a transaction with the provided reference.
                    Please check the ID and try again.
                  </p>
                </CardContent>
              </Card>
            </SlideUp>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

// Mock transaction for development
const MOCK_TRANSACTION: Transaction = {
  id: 'mock-transaction-id',
  type: 'mobile-credit',
  productName: 'Telkomsel 100,000',
  amount: 100000,
  customerDetail: '0812-3456-7890',
  status: 'success',
  date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
};

export default TransactionCheck;
