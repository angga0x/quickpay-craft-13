
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  basePrice?: number;
  type: 'mobile-credit' | 'electricity' | 'data-package';
  details?: {
    label: string;
    value: string;
  }[];
};

type ProductCardProps = {
  product: Product;
  onClick: (product: Product) => void;
  className?: string;
  isSelected?: boolean;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const ProductCard = ({ 
  product, 
  onClick, 
  className,
  isSelected = false
}: ProductCardProps) => {
  const { name, description, price, basePrice, details } = product;
  const discount = basePrice ? Math.round((basePrice - price) / basePrice * 100) : 0;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick(product)}
      className={className}
    >
      <Card className={cn(
        "h-full cursor-pointer overflow-hidden backdrop-blur-sm transition-all duration-300",
        isSelected ? "ring-2 ring-primary" : "hover:shadow-md",
        isSelected ? "bg-primary/5" : "bg-card/50"
      )}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{name}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              
              {discount > 0 && (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {discount}% OFF
                </Badge>
              )}
            </div>
            
            {details && details.length > 0 && (
              <div className="mt-2 space-y-1">
                {details.map((detail, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{detail.label}</span>
                    <span>{detail.value}</span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="pt-2 flex justify-between items-end">
              {basePrice && basePrice > price ? (
                <div className="flex flex-col">
                  <span className="text-sm line-through text-muted-foreground">
                    {formatCurrency(basePrice)}
                  </span>
                  <span className="font-medium text-base">
                    {formatCurrency(price)}
                  </span>
                </div>
              ) : (
                <span className="font-medium text-base">
                  {formatCurrency(price)}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProductCard;
