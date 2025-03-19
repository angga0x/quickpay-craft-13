
import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';

type SearchInputProps = {
  placeholder?: string;
  onChange: (value: string) => void;
  value: string;
  className?: string;
  autoFocus?: boolean;
};

const SearchInput = ({ 
  placeholder = "Search...", 
  onChange, 
  value, 
  className,
  autoFocus = false
}: SearchInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleClear = () => {
    onChange('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={cn(
      "relative flex items-center overflow-hidden rounded-full bg-muted/50 px-3 focus-within:ring-1 focus-within:ring-primary/50",
      isFocused ? "ring-1 ring-primary/50" : "",
      className
    )}>
      <Search className="h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="border-0 bg-transparent p-2 focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      {value && (
        <button 
          onClick={handleClear}
          className="focus:outline-none focus:ring-0"
          aria-label="Clear search"
        >
          <X className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
