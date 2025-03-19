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
import { getTransaction, toFirebaseTransaction, SupabaseTransaction } from '@/lib/supabase';
import { checkTransactionStatus } from '@/lib/api';
import { useTransactionStore } from '@/store/transactionStore';
import { useToast } from '@/hooks/use-toast';

const TransactionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [transaction, setTransaction] = useState<SupabaseTransaction | null>(null);
  
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
            title: 'Transaksi tidak ditemukan',
            description: 'Transaksi yang Anda cari tidak ada',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }
        
        setTransaction(data);
      } catch (error) {
        console.error('Error fetching transaction:', error);
        toast({
          title: 'Gagal memuat transaksi',
          description: 'Silakan coba lagi nanti',
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
      
      // For now, we maintain the original API call format
      const response = await checkTransactionStatus(transaction.transaction_id);
      
      setTransaction(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          status: response.status,
          details: response.details || {},
          updated_at: new Date()
        };
      });
      
      if (response.status === 'success') {
        toast({
          title: 'Pembayaran berhasil',
          description: 'Transaksi Anda telah selesai',
          variant: 'default',
        });
      } else if (response.status === 'failed') {
        toast({
          title: 'Pembayaran gagal',
          description: response.details?.message || 'Transaksi tidak dapat diselesaikan',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Pembayaran tertunda',
          description: 'Pembayaran Anda masih diproses',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Error checking status:', error);
      toast({
        title: 'Gagal memeriksa status',
        description: 'Silakan coba lagi nanti',
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
          title: 'Detail Transaksi',
          text: `${transaction.product_name} untuk ${transaction.customer_id}`,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Tautan disalin',
          description: 'Tautan transaksi disalin ke clipboard',
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
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    }).format(date);
  };
  
  const shouldShowQR = () => {
    if (!transaction) return false;
    
    return (
      transaction.status === 'pending' && 
      (
        (transaction.qr_string && transaction.expiry_time) ||
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
            <h1 className="text-2xl font-medium">Detail Transaksi</h1>
            <p className="text-sm text-muted-foreground">
              {transaction ? `Referensi: ${transaction.reference_id}` : 'Memuat detail transaksi...'}
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
                            <h3 className="font-medium">{transaction.product_name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        {getStatusBadge()}
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">ID Transaksi</span>
                          <span className="text-sm font-mono">{transaction.transaction_id}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">ID Referensi</span>
                          <span className="text-sm font-mono">{transaction.reference_id}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Pelanggan</span>
                          <span className="text-sm">{transaction.customer_id}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Jumlah</span>
                          <span className="text-sm font-medium">{formatCurrency(transaction.amount)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Tanggal & Waktu</span>
                          <span className="text-sm">{formatDate(transaction.created_at)}</span>
                        </div>
                      </div>
                      
                      {transaction.status === 'success' && transaction.details && (
                        <>
                          <Separator />
                          
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium">Detail Transaksi</h4>
                            
                            <div className="bg-muted/50 rounded-md p-3 space-y-2">
                              {transaction.details.serial_number && (
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground">Nomor Seri</span>
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
                                  <span className="text-muted-foreground">Pesan</span>
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
                            <h4 className="text-sm font-medium">Alasan Kegagalan</h4>
                            
                            <div className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-md p-3">
                              <p className="text-sm">{transaction.details.message}</p>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-muted-foreground">Transaksi tidak ditemukan</p>
                      <Button variant="link" onClick={() => navigate('/')}>
                        Kembali ke beranda
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
                  {isChecking ? 'Memeriksa Status...' : 'Periksa Status'}
                </Button>
              </SlideUp>
            )}
          </div>
          
          <div className="space-y-6">
            {shouldShowQR() && (
              <QRISDisplay 
                qrValue={transaction?.qr_string || qrString || ''}
                amount={transaction?.amount || 0}
                expiryTime={transaction?.expiry_time || expiryTime || undefined}
                paymentUrl={transaction?.payment_url || undefined}
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
                      Transaksi Berhasil
                    </h3>
                    
                    <p className="text-green-700 dark:text-green-400 mb-6">
                      Transaksi Anda telah berhasil diselesaikan
                    </p>
                    
                    <Button
                      onClick={() => navigate('/')}
                      variant="outline"
                      className="border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50"
                    >
                      Kembali ke Beranda
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
                      Transaksi Gagal
                    </h3>
                    
                    <p className="text-red-700 dark:text-red-400 mb-6">
                      {transaction.details?.message || "Transaksi Anda tidak dapat diselesaikan"}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={() => navigate('/')}
                        variant="outline"
                        className="border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50"
                      >
                        Kembali ke Beranda
                      </Button>
                      
                      <Button
                        onClick={() => navigate(-1)}
                        variant="outline"
                        className="border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50"
                      >
                        Coba Lagi
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

const MOCK_TRANSACTION: SupabaseTransaction = {
  id: 'mock-id',
  reference_id: 'REF1234567890123',
  transaction_id: 'TRX1234567890123',
  customer_id: '0812-3456-7890',
  type: 'mobile-credit',
  product_code: 'MC-TEL-100000',
  product_name: 'Telkomsel 100,000',
  amount: 100000,
  status: 'pending',
  qr_string: '00020101021226570014A00000007750415530303611091234567890520400005303360540110215802ID5920Sample Merchant Name6013JAKARTA PUSAT6105101166304A69A',
  expiry_time: new Date(Date.now() + 15 * 60 * 1000),
  created_at: new Date(),
  updated_at: new Date(),
};

export default TransactionDetail;
