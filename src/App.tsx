
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Index from "./pages/Index";
import MobileCredit from "./pages/MobileCredit";
import ElectricityToken from "./pages/ElectricityToken";
import DataPackage from "./pages/DataPackage";
import Checkout from "./pages/Checkout";
import TransactionDetail from "./pages/TransactionDetail";
import TransactionCheck from "./pages/TransactionCheck";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/mobile-credit" element={<MobileCredit />} />
            <Route path="/electricity" element={<ElectricityToken />} />
            <Route path="/data-package" element={<DataPackage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/transaction/:id" element={<TransactionDetail />} />
            <Route path="/transaction-check" element={<TransactionCheck />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
