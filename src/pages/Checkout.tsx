
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Receipt, BadgeCheck, PhoneCall, Mail } from 'lucide-react';
import AnimatedNumber, { formatAsCurrency } from '@/components/ui-custom/AnimatedNumber';
import QRISDisplay from '@/components/ui-custom/QRISDisplay';
import PageTransition, { SlideUp } from '@/components/ui-custom/TransitionEffect';
import { saveTransaction } from '@/lib/supabase';
import { processTransaction } from '@/lib/api';
import { createPaymentOrder } from '@/lib/tokopay';
import { useTransactionStore } from '@/store/transactionStore';
import { useToast } from '@/hooks/use-toast';

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { 
    selectedProduct, 
    customerInfo,
    isLoading,
    setLoading,
    setCurrentTransaction,
    setQRData,
    qrString,
    expiryTime
  } = useTransactionStore();
  
  if (!selectedProduct || !customerInfo) {
    navigate('/');
    return null;
  }
  
  const generateReferenceId = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `REF${timestamp}${random}`;
  };
  
  const handleProcessPayment = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      setLoading(true);
      
      const referenceId = generateReferenceId();
      
      const paymentResponse = await createPaymentOrder({
        ref_id: referenceId,
        nominal: selectedProduct.price,
        metode: 'QRIS'
      });
      
      if (paymentResponse.status !== "Success") {
        throw new Error("Payment processing failed");
      }
      
      const productResponse = await processTransaction({
        product_code: selectedProduct.id,
        customer_id: customerInfo.phoneNumber,
        reference_id: referenceId,
        type: selectedProduct.type
      });
      
      const expiryTime = new Date(Date.now() + 15 * 60 * 1000);
      
      if (import.meta.env.DEV) {
        console.log('DEV mode: Mocking transaction save');
        setCurrentTransaction('mock-transaction-id', referenceId);
        setQRData(
          paymentResponse.data.qr_string,
          expiryTime
        );
        setTimeout(() => {
          navigate('/transaction/mock-transaction-id');
        }, 1000);
      } else {
        const transactionId = await saveTransaction({
          referenceId,
          transactionId: productResponse.transaction_id,
          customerId: customerInfo.phoneNumber,
          type: selectedProduct.type,
          productCode: selectedProduct.id,
          productName: selectedProduct.name,
          amount: selectedProduct.price,
          status: 'pending',
          qrString: paymentResponse.data.qr_string,
          expiryTime: expiryTime,
          paymentOrderId: paymentResponse.data.trx_id,
          paymentCode: paymentResponse.data.qr_string,
          paymentUrl: paymentResponse.data.pay_url,
          details: {
            totalBayar: paymentResponse.data.total_bayar,
            totalDiterima: paymentResponse.data.total_diterima,
            qrLink: paymentResponse.data.qr_link
          }
        });
        
        setCurrentTransaction(transactionId, referenceId);
        setQRData(
          paymentResponse.data.qr_string,
          expiryTime
        );
        navigate(`/transaction/${transactionId}`);
      }
      
      toast({
        title: "Payment processing",
        description: "Please complete the payment",
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: 'Payment processing failed',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };
  
  const handleDownloadQR = () => {
    toast({
      title: "QR Code saved",
      description: "QR code has been saved to your device"
    });
  };
  
  const getCustomerDetail = () => {
    switch (selectedProduct.type) {
      case 'mobile-credit':
      case 'data-package':
        return customerInfo.phoneNumber;
      case 'electricity':
        return `${customerInfo.phoneNumber} ${customerInfo.name ? `(${customerInfo.name})` : ''}`;
    }
  };
  
  const getCustomerIcon = () => {
    switch (selectedProduct.type) {
      case 'mobile-credit':
      case 'data-package':
        return <PhoneCall className="h-4 w-4" />;
      case 'electricity':
        return <BadgeCheck className="h-4 w-4" />;
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
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-medium">Checkout</h1>
            <p className="text-sm text-muted-foreground">
              Review your order and complete payment
            </p>
          </div>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <SlideUp>
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Receipt className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Order Summary</h3>
                      <p className="text-xs text-muted-foreground">Review your purchase details</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm text-muted-foreground">Product</h4>
                      <p className="font-medium">{selectedProduct.name}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm text-muted-foreground">Customer</h4>
                      <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full text-xs">
                        {getCustomerIcon()}
                        <span>{getCustomerDetail()}</span>
                      </div>
                    </div>
                    
                    {selectedProduct.details && (
                      <div className="space-y-2">
                        <h4 className="text-sm text-muted-foreground">Details</h4>
                        <div className="bg-muted/50 rounded-md p-3 space-y-2">
                          {selectedProduct.details.map((detail, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">{detail.label}</span>
                              <span>{detail.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Subtotal</span>
                        <AnimatedNumber 
                          value={selectedProduct.price} 
                          formatValue={formatAsCurrency}
                          className="font-medium"
                        />
                      </div>
                      
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-muted-foreground">Fee</span>
                        <span>Rp0</span>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4 text-lg">
                        <span className="font-medium">Total</span>
                        <AnimatedNumber 
                          value={selectedProduct.price} 
                          formatValue={formatAsCurrency}
                          className="font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </SlideUp>
          </div>
          
          <div className="space-y-6">
            {qrString && expiryTime ? (
              <QRISDisplay 
                qrValue={qrString}
                amount={selectedProduct.price}
                expiryTime={expiryTime}
                onDownload={handleDownloadQR}
              />
            ) : (
              <SlideUp>
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                        <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-medium">Notification</h3>
                        <p className="text-xs text-muted-foreground">We'll send updates to</p>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-muted/50 rounded-md">
                      <p className="text-sm">{customerInfo.phoneNumber}</p>
                    </div>
                    
                    <Button 
                      className="w-full"
                      size="lg"
                      onClick={handleProcessPayment}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Pay Now'}
                    </Button>
                    
                    <p className="text-xs text-center text-muted-foreground">
                      By proceeding, you agree to our Terms and Privacy Policy
                    </p>
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

export default Checkout;
