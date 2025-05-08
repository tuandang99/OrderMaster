import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import MainLayout from "@/components/layout/main-layout";
import NotFound from "@/pages/not-found";

// Pages
import Dashboard from "@/pages/dashboard";
import OrdersIndex from "@/pages/orders/index";
import NewOrder from "@/pages/orders/new";
import OrderDetails from "@/pages/orders/[id]";
import ShippingIndex from "@/pages/shipping/index";
import CustomersIndex from "@/pages/customers/index";
import CustomerDetails from "@/pages/customers/[id]";
import ProductsIndex from "@/pages/products/index";
import ProductDetails from "@/pages/products/[id]";
import ReportsIndex from "@/pages/reports/index";
import SettingsIndex from "@/pages/settings/index";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/orders" component={OrdersIndex} />
      <Route path="/orders/new" component={NewOrder} />
      <Route path="/orders/:id" component={OrderDetails} />
      <Route path="/shipping" component={ShippingIndex} />
      <Route path="/customers" component={CustomersIndex} />
      <Route path="/customers/:id" component={CustomerDetails} />
      <Route path="/products" component={ProductsIndex} />
      <Route path="/products/:id" component={ProductDetails} />
      <Route path="/reports" component={ReportsIndex} />
      <Route path="/settings" component={SettingsIndex} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <MainLayout>
          <Router />
        </MainLayout>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
