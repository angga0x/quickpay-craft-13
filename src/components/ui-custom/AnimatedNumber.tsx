
import React, { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

type AnimatedNumberProps = {
  value: number;
  formatValue?: (value: number) => string;
  className?: string;
};

// Default formatting function
const defaultFormatValue = (value: number): string => {
  return value.toLocaleString();
};

// Format as currency (IDR)
export const formatAsCurrency = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

const AnimatedNumber = ({ 
  value, 
  formatValue = defaultFormatValue,
  className = ""
}: AnimatedNumberProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  // Setup a spring animation for smooth transitions
  const springValue = useSpring(0, {
    stiffness: 100,
    damping: 30,
    duration: 0.5
  });
  
  // Update the spring value when the actual value changes
  useEffect(() => {
    springValue.set(value);
    
    const unsubscribe = springValue.onChange(v => {
      setDisplayValue(Math.round(v));
    });
    
    return unsubscribe;
  }, [value, springValue]);
  
  return (
    <motion.span
      layout
      className={className}
    >
      {formatValue(displayValue)}
    </motion.span>
  );
};

export default AnimatedNumber;
