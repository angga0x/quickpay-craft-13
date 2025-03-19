import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Receipt, AlertCircle } from 'lucide-react';
import PageTransition, { SlideUp } from '@/components/ui-custom/TransitionEffect';
import { findTransactionByReference, toRecentTransactionFormat } from '@/lib/firebase';
import { checkPaymentStatus } from '@/lib/tokopay';
import RecentTransactionCard, { Transaction as UITransaction } from '@/components/ui-custom/RecentTransactionCard';
import { useToast } from '@/hooks/use-toast';

const TransactionCheck = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reference, setReference] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<UITransaction | null>(null);
  const [notFound, setNotFound] = useState(false);
  
  const handleReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReference(e.target.value);
    
    if (searchResult) setSearchResult(null);
    if (notFound) setNotFound(false);
  };
  
  const handleSearch = async () => {
    if (!reference.trim()) {
      toast({
        title: 'Masukkan referensi',
        description: 'Masukkan ID transaksi atau ID referensi',
        variant: 'default',
      });
      return;
    }
    
    try {
      setIsSearching(true);
      setSearchResult(null);
      setNotFound(false);
      
      if (import.meta.env.DEV) {
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
      
      // Check transaction in Firebase first
      const result = await findTransactionByReference(reference.trim());
      
      if (result) {
        // If found in Firebase, get the latest payment status from TokoPay
        try {
          const paymentStatus = await checkPaymentStatus(result.referenceId);
          
          if (paymentStatus.status && paymentStatus.data) {
            // Update the status based on TokoPay's response
            if (paymentStatus.data.status === 'SUCCESS' && result.status !== 'success') {
              // Here we would update the transaction status in Firebase, but for simplicity
              // we'll just update the status in the UI
              result.status = 'success';
            } else if (paymentStatus.data.status === 'FAILED' && result.status !== 'failed') {
              result.status = 'failed';
            }
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
          // Continue with the current status if there was an error checking the payment status
        }
        
        setSearchResult(toRecentTransactionFormat(result));
      } else {
        setNotFound(true);
        toast({
          title: 'Transaksi tidak ditemukan',
          description: 'Kami tidak dapat menemukan transaksi dengan referensi ini',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Error searching transaction:', error);
      toast({
        title: 'Pencarian gagal',
        description: 'Silakan coba lagi nanti',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleViewTransaction = () => {
    if (searchResult) {
      navigate(`/transaction/${searchResult.id}`);
    }
  };
  
  return (
    <PageTransition>
      <div className="container max-w-5xl mx-auto px-6 py-8">
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
            <h1 className="text-2xl font-medium">Cek Transaksi</h1>
            <p className="text-sm text-muted-foreground">
              Temukan transaksi menggunakan referensi atau ID transaksi
            </p>
          </div>
        </motion.div>
        
        <div className="max-w-2xl mx-auto space-y-8">
          <SlideUp>
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Receipt className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Pencarian Transaksi</h3>
                    <p className="text-xs text-muted-foreground">Masukkan ID referensi atau ID transaksi</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      id="reference"
                      placeholder="Masukkan referensi atau ID transaksi"
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
                    {isSearching ? 'Mencari...' : 'Cari Transaksi'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </SlideUp>
          
          {isSearching && (
            <div className="h-32 rounded-lg loading-placeholder" />
          )}
          
          {searchResult && (
            <SlideUp>
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Hasil Pencarian</h3>
                <RecentTransactionCard 
                  transaction={searchResult}
                  onClick={handleViewTransaction}
                />
                <div className="flex justify-center">
                  <Button onClick={handleViewTransaction}>
                    Lihat Detail
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
                    Transaksi Tidak Ditemukan
                  </h3>
                  
                  <p className="text-muted-foreground mb-4">
                    Kami tidak dapat menemukan transaksi dengan referensi yang diberikan.
                    Silakan periksa ID dan coba lagi.
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

const MOCK_TRANSACTION: UITransaction = {
  id: 'mock-transaction-id',
  type: 'mobile-credit',
  productName: 'Telkomsel 100,000',
  amount: 100000,
  customerDetail: '0812-3456-7890',
  status: 'success',
  date: new Date(Date.now() - 2 * 60 * 60 * 1000),
};

export default TransactionCheck;
