import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Receipt, 
  RefreshCw,
  Share2,
  CreditCard,
  Zap,
  Radio,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import QRISDisplay from '@/components/ui-custom/QRISDisplay';
import PageTransition, { SlideUp } from '@/components/ui-custom/TransitionEffect';
import { getTransaction, Transaction } from '@/lib/firebase';
import { checkTransactionStatus } from '@/lib/api';
import { useTransactionStore } from '@/store/transactionStore';
import { useToast } from '@/hooks/use-toast';

const TransactionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  
  const { 
    qrString, 
    expiryTime,
    currentTransactionId
  } = useTransactionStore();
  
  const transactionId = id || currentTransactionId;
  
  useEffect(() => {
    if (!transactionId) {
      navigate('/');
      return;
    }
    
    const fetchTransaction = async () => {
      try {
        setIsLoading(true);
        
        if (import.meta.env.DEV) {
          setTimeout(() => {
            setTransaction(MOCK_TRANSACTION);
            setIsLoading(false);
          }, 1000);
          return;
        }
        
        const data = await getTransaction(transactionId);
        
        if (!data) {
          toast({
            title: 'Transaction not found',
            description: 'The transaction you are looking for does not exist',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }
        
        setTransaction(data);
      } catch (error) {
        console.error('Error fetching transaction:', error);
        toast({
          title: 'Failed to load transaction',
          description: 'Please try again later',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransaction();
  }, [transactionId, navigate, toast]);
  
  const handleCheckStatus = async () => {
    if (!transaction || isChecking) return;
    
    try {
      setIsChecking(true);
      
      const response = await checkTransactionStatus(transaction.transactionId);
      
      setTransaction(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          status: response.status,
          details: response.details || {},
          updatedAt: new Date()
        };
      });
      
      if (response.status === 'success') {
        toast({
          title: 'Payment successful',
          description: 'Your transaction has been completed',
          variant: 'default',
        });
      } else if (response.status === 'failed') {
        toast({
          title: 'Payment failed',
          description: response.details?.message || 'Transaction could not be completed',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Payment pending',
          description: 'Your payment is still being processed',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Error checking status:', error);
      toast({
        title: 'Status check failed',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsChecking(false);
    }
  };
  
  const handleShare = async () => {
    if (!transaction) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Transaction Details',
          text: `${transaction.productName} for ${transaction.customerId}`,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link copied',
          description: 'Transaction link copied to clipboard',
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  const getTypeIcon = () => {
    if (!transaction) return null;
    
    switch (transaction.type) {
      case 'mobile-credit':
        return <CreditCard className="h-5 w-5 text-blue-500" />;
      case 'electricity':
        return <Zap className="h-5 w-5 text-yellow-500" />;
      case 'data-package':
        return <Radio className="h-5 w-5 text-purple-500" />;
    }
  };
  
  const getStatusBadge = () => {
    if (!transaction) return null;
    
    let color = '';
    let icon = null;
    
    switch (transaction.status) {
      case 'success':
        color = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        icon = <CheckCircle2 className="h-4 w-4" />;
        break;
      case 'pending':
        color = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
        icon = <Clock className="h-4 w-4" />;
        break;
      case 'failed':
        color = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        icon = <AlertCircle className="h-4 w-4" />;
        break;
    }
    
    return (
      <Badge className={`flex items-center gap-1 text-xs ${color}`}>
        {icon}
        <span className="capitalize">{transaction.status}</span>
      </Badge>
    );
  };
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };
  
  const shouldShowQR = () => {
    if (!transaction) return false;
    
    return (
      transaction.status === 'pending' && 
      (
        (transaction.qrString && transaction.expiryTime) ||
        (qrString && expiryTime)
      )
    );
  };
  
  const getQRImageUrl = () => {
    if (!transaction) return undefined;
    
    return transaction.details?.qrLink;
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
          <div className="flex-1">
            <h1 className="text-2xl font-medium">Transaction Details</h1>
            <p className="text-sm text-muted-foreground">
              {transaction ? `Reference: ${transaction.referenceId}` : 'Loading transaction details...'}
            </p>
          </div>
          
          {transaction && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleShare}
              className="rounded-full"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          )}
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <SlideUp>
              <Card>
                <CardContent className="p-6 space-y-6">
                  {isLoading ? (
                    <div className="space-y-4">
                      <div className="h-10 rounded-lg loading-placeholder" />
                      <div className="h-24 rounded-lg loading-placeholder" />
                      <div className="h-16 rounded-lg loading-placeholder" />
                    </div>
                  ) : transaction ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            {getTypeIcon()}
                          </div>
                          <div>
                            <h3 className="font-medium">{transaction.productName}</h3>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        {getStatusBadge()}
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Transaction ID</span>
                          <span className="text-sm font-mono">{transaction.transactionId}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Reference ID</span>
                          <span className="text-sm font-mono">{transaction.referenceId}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Customer</span>
                          <span className="text-sm">{transaction.customerId}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Amount</span>
                          <span className="text-sm font-medium">{formatCurrency(transaction.amount)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Date & Time</span>
                          <span className="text-sm">{formatDate(transaction.createdAt)}</span>
                        </div>
                      </div>
                      
                      {transaction.status === 'success' && transaction.details && (
                        <>
                          <Separator />
                          
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium">Transaction Details</h4>
                            
                            <div className="bg-muted/50 rounded-md p-3 space-y-2">
                              {transaction.details.serial_number && (
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground">Serial Number</span>
                                  <span className="font-mono">{transaction.details.serial_number}</span>
                                </div>
                              )}
                              
                              {transaction.details.token && (
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground">Token</span>
                                  <span className="font-mono font-medium">{transaction.details.token}</span>
                                </div>
                              )}
                              
                              {transaction.details.message && (
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Message</span>
                                  <p className="mt-1">{transaction.details.message}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                      
                      {transaction.status === 'failed' && transaction.details?.message && (
                        <>
                          <Separator />
                          
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium">Failure Reason</h4>
                            
                            <div className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-md p-3">
                              <p className="text-sm">{transaction.details.message}</p>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-muted-foreground">Transaction not found</p>
                      <Button variant="link" onClick={() => navigate('/')}>
                        Return to home
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </SlideUp>
            
            {!isLoading && transaction && transaction.status === 'pending' && (
              <SlideUp>
                <Button 
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleCheckStatus}
                  disabled={isChecking}
                >
                  <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
                  {isChecking ? 'Checking Status...' : 'Check Status'}
                </Button>
              </SlideUp>
            )}
          </div>
          
          <div className="space-y-6">
            {shouldShowQR() && (
              <QRISDisplay 
                qrValue={transaction?.qrString || qrString || ''}
                amount={transaction?.amount || 0}
                expiryTime={transaction?.expiryTime || expiryTime || undefined}
                paymentUrl={transaction?.paymentUrl || undefined}
                qrImageUrl={getQRImageUrl()}
              />
            )}
            
            {!isLoading && transaction && transaction.status === 'success' && (
              <SlideUp>
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-100 dark:border-green-900/30">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    
                    <h3 className="text-xl font-medium text-green-800 dark:text-green-300 mb-2">
                      Transaction Successful
                    </h3>
                    
                    <p className="text-green-700 dark:text-green-400 mb-6">
                      Your transaction has been completed successfully
                    </p>
                    
                    <Button
                      onClick={() => navigate('/')}
                      variant="outline"
                      className="border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50"
                    >
                      Back to Home
                    </Button>
                  </CardContent>
                </Card>
              </SlideUp>
            )}
            
            {!isLoading && transaction && transaction.status === 'failed' && (
              <SlideUp>
                <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-100 dark:border-red-900/30">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
                      <AlertCircle className="h-8 w-8" />
                    </div>
                    
                    <h3 className="text-xl font-medium text-red-800 dark:text-red-300 mb-2">
                      Transaction Failed
                    </h3>
                    
                    <p className="text-red-700 dark:text-red-400 mb-6">
                      {transaction.details?.message || "Your transaction could not be completed"}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={() => navigate('/')}
                        variant="outline"
                        className="border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50"
                      >
                        Back to Home
                      </Button>
                      
                      <Button
                        onClick={() => navigate(-1)}
                        variant="outline"
                        className="border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50"
                      >
                        Try Again
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </SlideUp>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

const MOCK_TRANSACTION: Transaction = {
  id: 'mock-id',
  referenceId: 'REF1234567890123',
  transactionId: 'TRX1234567890123',
  customerId: '0812-3456-7890',
  type: 'mobile-credit',
  productCode: 'MC-TEL-100000',
  productName: 'Telkomsel 100,000',
  amount: 100000,
  status: 'pending',
  qrString: '00020101021226570014A00000007750415530303611091234567890520400005303360540110215802ID5920Sample Merchant Name6013JAKARTA PUSAT6105101166304A69A',
  expiryTime: new Date(Date.now() + 15 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default TransactionDetail;
