import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Zap, Radio, Search, Clock } from 'lucide-react';
import SearchInput from '@/components/ui-custom/SearchInput';
import RecentTransactionCard, { Transaction as UITransaction } from '@/components/ui-custom/RecentTransactionCard';
import { StaggerContainer, StaggerItem, SlideUp } from '@/components/ui-custom/TransitionEffect';
import { getRecentTransactions, toRecentTransactionFormat } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [search, setSearch] = useState('');
  const [transactions, setTransactions] = useState<UITransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        // In development, return mock data until Firebase is configured
        if (import.meta.env.DEV) {
          setTimeout(() => {
            setTransactions(MOCK_TRANSACTIONS);
            setIsLoading(false);
          }, 1000);
          return;
        }

        const data = await getRecentTransactions(5);
        // Transform the data to match the expected format
        const formattedData = data.map(toRecentTransactionFormat);
        setTransactions(formattedData);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        toast({
          title: 'Gagal memuat transaksi',
          description: 'Silakan coba lagi nanti',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [toast]);

  const serviceCards = [
    {
      title: 'Pulsa',
      icon: <CreditCard className="h-5 w-5" />,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
      link: '/mobile-credit',
    },
    {
      title: 'Listrik',
      icon: <Zap className="h-5 w-5" />,
      color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300',
      link: '/electricity',
    },
    {
      title: 'Paket Data',
      icon: <Radio className="h-5 w-5" />,
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300',
      link: '/data-package',
    },
    {
      title: 'Cek Status',
      icon: <Search className="h-5 w-5" />,
      color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300',
      link: '/transaction-check',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full bg-gradient-to-br from-primary/5 to-primary/20 pt-20 pb-24 px-6"
      >
        <div className="container max-w-5xl mx-auto flex flex-col items-center">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-medium text-center"
          >
            Bayar Tagihan Dengan Cepat
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-center text-muted-foreground max-w-lg"
          >
            Cara cepat, aman, dan praktis untuk membeli pulsa, token listrik, dan paket data.
          </motion.p>
        </div>
      </motion.div>

      {/* Services Section */}
      <SlideUp className="container max-w-5xl mx-auto -mt-12 px-6">
        <Card className="glass-card shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-xl font-medium mb-4">Layanan Kami</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {serviceCards.map((service, index) => (
                <Link to={service.link} key={index}>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex flex-col items-center p-4 rounded-lg cursor-pointer hover:bg-muted/50 transition-all"
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${service.color} mb-3`}>
                      {service.icon}
                    </div>
                    <span className="text-sm font-medium text-center">{service.title}</span>
                  </motion.div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </SlideUp>

      {/* Transactions Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.3 } }}
        className="container max-w-5xl mx-auto px-6 mt-8 mb-12"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-medium">Transaksi Terakhir</h2>
            <p className="text-sm text-muted-foreground">Riwayat transaksi Anda</p>
          </div>
          
          <div className="flex items-center gap-3">
            <SearchInput 
              placeholder="Cari transaksi..." 
              value={search} 
              onChange={setSearch}
              className="w-full md:w-60"
            />
            
            <Link to="/transaction-check">
              <Button variant="outline" size="sm" className="whitespace-nowrap gap-2">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Lihat Semua</span>
              </Button>
            </Link>
          </div>
        </div>

        <Separator className="my-4" />

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-24 rounded-lg loading-placeholder" />
            ))}
          </div>
        ) : transactions.length > 0 ? (
          <StaggerContainer className="space-y-3">
            {transactions.map((transaction) => (
              <StaggerItem key={transaction.id}>
                <RecentTransactionCard transaction={transaction} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">Tidak ada transaksi terbaru</p>
            <Button variant="link" asChild className="mt-2">
              <Link to="/mobile-credit">Buat transaksi pertama Anda</Link>
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Mock transaction data for development
const MOCK_TRANSACTIONS: UITransaction[] = [
  {
    id: '1',
    type: 'mobile-credit',
    productName: 'Telkomsel 100.000',
    amount: 100000,
    customerDetail: '0812-3456-7890',
    status: 'success',
    date: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
  },
  {
    id: '2',
    type: 'electricity',
    productName: 'Token Listrik 200.000',
    amount: 200000,
    customerDetail: '1234-5678-9012',
    status: 'pending',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: '3',
    type: 'data-package',
    productName: 'XL Data 10GB',
    amount: 55000,
    customerDetail: '0878-9012-3456',
    status: 'failed',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
];

export default Index;
