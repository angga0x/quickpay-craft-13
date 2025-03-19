
import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Zap, 
  Radio, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export type TransactionStatus = 'success' | 'pending' | 'failed';

export type Transaction = {
  id: string;
  type: 'mobile-credit' | 'electricity' | 'data-package';
  productName: string;
  amount: number;
  customerDetail: string;
  status: TransactionStatus;
  date: Date;
};

const getStatusColor = (status: TransactionStatus) => {
  switch (status) {
    case 'success':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'failed':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  }
};

const getStatusIcon = (status: TransactionStatus) => {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'pending':
      return <Clock className="h-4 w-4" />;
    case 'failed':
      return <AlertCircle className="h-4 w-4" />;
  }
};

const getTypeIcon = (type: Transaction['type']) => {
  switch (type) {
    case 'mobile-credit':
      return <CreditCard className="h-5 w-5 text-blue-500" />;
    case 'electricity':
      return <Zap className="h-5 w-5 text-yellow-500" />;
    case 'data-package':
      return <Radio className="h-5 w-5 text-purple-500" />;
  }
};

const getTypeName = (type: Transaction['type']) => {
  switch (type) {
    case 'mobile-credit':
      return 'Mobile Credit';
    case 'electricity':
      return 'Electricity';
    case 'data-package':
      return 'Data Package';
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

type RecentTransactionCardProps = {
  transaction: Transaction;
  onClick?: () => void;
  className?: string;
};

const RecentTransactionCard = ({ 
  transaction, 
  onClick,
  className 
}: RecentTransactionCardProps) => {
  const { 
    id, 
    type, 
    productName, 
    amount, 
    customerDetail, 
    status, 
    date 
  } = transaction;
  
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Link to={`/transaction/${id}`}>
        <Card className="overflow-hidden border bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  {getTypeIcon(type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm">{productName}</h3>
                    <Badge variant="outline" className="text-xs">
                      {getTypeName(type)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{customerDetail}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className={cn("flex items-center gap-1 text-xs", getStatusColor(status))}>
                  {getStatusIcon(status)}
                  <span className="capitalize">{status}</span>
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(date, { addSuffix: true })}
                </span>
              </div>
              <p className="font-medium">{formatCurrency(amount)}</p>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};

export default RecentTransactionCard;
