
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy, CheckCheck, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { SlideUp } from './TransitionEffect';

type QRISDisplayProps = {
  qrValue: string;
  amount: number;
  expiryTime?: Date;
  paymentUrl?: string;
  onDownload?: () => void;
  className?: string;
  qrImageUrl?: string; // Add support for direct QR image URL
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatCountdown = (timeLeft: number) => {
  if (timeLeft <= 0) return '00:00';
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const QRISDisplay = ({ 
  qrValue, 
  amount, 
  expiryTime,
  paymentUrl,
  onDownload,
  className,
  qrImageUrl 
}: QRISDisplayProps) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (expiryTime) {
      const calculateTimeLeft = () => {
        const difference = Math.floor((expiryTime.getTime() - new Date().getTime()) / 1000);
        return difference > 0 ? difference : 0;
      };

      setTimeLeft(calculateTimeLeft());
      
      const timer = setInterval(() => {
        const remaining = calculateTimeLeft();
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          clearInterval(timer);
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [expiryTime]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy QR data', err);
    }
  };
  
  const handleOpenPaymentUrl = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
    }
  };

  return (
    <SlideUp className={className}>
      <Card className="overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col items-center">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className="text-2xl font-medium">{formatCurrency(amount)}</span>
            
            {expiryTime && (
              <div className="mt-2 text-center">
                <span className="text-xs text-muted-foreground">Valid for</span>
                <div className={`font-mono text-sm font-medium ${timeLeft < 60 ? 'text-red-500' : ''}`}>
                  {formatCountdown(timeLeft)}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-center py-2">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-white p-4 rounded-lg"
            >
              {qrImageUrl ? (
                <img 
                  src={qrImageUrl}
                  alt="QRIS Payment Code"
                  className="w-56 h-56 object-contain"
                />
              ) : (
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrValue)}`}
                  alt="QRIS Payment Code"
                  className="w-56 h-56 object-contain"
                />
              )}
            </motion.div>
          </div>
          
          <p className="text-center text-sm text-muted-foreground">
            Scan with any QRIS-compatible payment app
          </p>
          
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopy}
              className="gap-1.5"
            >
              {copied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onDownload}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" />
              Save
            </Button>
            
            {paymentUrl && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleOpenPaymentUrl}
                className="gap-1.5"
              >
                <ExternalLink className="h-4 w-4" />
                Open Payment Page
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </SlideUp>
  );
};

export default QRISDisplay;
