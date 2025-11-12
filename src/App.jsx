import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Toaster } from 'react-hot-toast';

// Public Pages
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/auth/LoginPage';
import InternalLoginPage from './pages/auth/InternalLoginPage';


// Internal Pages
import PlanningRFQDetail from './pages/planning/PlanningRFQDetail';
import QuotesList from './pages/internal/QuotesList';
import QuoteDetail from './pages/internal/QuoteDetail';
import OrderList from './pages/internal/OrderList';
import OrderDetail from './pages/internal/OrderDetail';
import InternalDashboard from './pages/internal/Dashboard';
import QuoteRequests from './pages/internal/QuoteRequests';

// Customer Pages
import CustomerDashboard from './pages/customer/Dashboard';
import QuoteRequest from './pages/customer/QuoteRequest';
import CustomerRfqs from './pages/customer/CustomerRfqs';
import CustomerQuotations from './pages/customer/CustomerQuotations';
import CustomerQuotationDetail from './pages/customer/CustomerQuotationDetail';
import CustomerRfqDetail from './pages/customer/CustomerRfqDetail';
import CartPage from './pages/customer/CartPage';
import CustomerOrders from './pages/customer/CustomerOrders';
import CustomerOrderDetail from './pages/customer/CustomerOrderDetail';

// Planning Pages
import PlanningRfqs from './pages/planning/PlanningRfqs';
import ProductionPlanDetail from './pages/planning/ProductionPlanDetail';
import ProductionLots from './pages/planning/ProductionLots'; // Import new component

// Director Pages
import ContractApproval from './pages/director/ContractApproval';
import DirectorRfqList from './pages/director/DirectorRfqList'; // Import the new page

// Sales Pages
import MyRfqs from './pages/sales/MyRfqs';
import ContractUpload from './pages/internal/ContractUpload';

// Admin Pages
import AdminUserManagement from './pages/admin/AdminUserManagement';
import AdminCustomerManagement from './pages/admin/AdminCustomerManagement';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="main-container">
            <Toaster position="bottom-right" reverseOrder={false} />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/internal-login" element={<InternalLoginPage />} />

              

              {/* Internal routes - NO AUTH GUARD (for now) */}
              <Route path="/internal/dashboard" element={<InternalDashboard />} />
              <Route path="/sales/quotations" element={<QuotesList />} />
              <Route path="/internal/quote-requests" element={<QuoteRequests />} />
              <Route path="/sales/quotations/:id" element={<QuoteDetail />} />
              <Route path="/internal/orders" element={<OrderList />} />
              <Route path="/internal/orders/:id" element={<OrderDetail />} />

              {/* Customer routes */}
              <Route path="/customer/dashboard" element={<CustomerDashboard />} />
              <Route path="/customer/quote-request" element={<QuoteRequest />} />
              <Route path="/customer/rfqs" element={<CustomerRfqs />} />
              <Route path="/customer/quotations" element={<CustomerQuotations />} />
              <Route path="/customer/quotations/:id" element={<CustomerQuotationDetail />} />
              <Route path="/customer/rfqs/:id" element={<CustomerRfqDetail />} /> {/* New route */}
              <Route path="/cart" element={<CartPage />} />
              <Route path="/customer/orders" element={<CustomerOrders />} />
              <Route path="/customer/orders/:id" element={<CustomerOrderDetail />} />

              {/* Planning routes */}
              <Route path="/planning/rfqs" element={<PlanningRfqs />} />
              <Route path="/planning/rfqs/:id" element={<PlanningRFQDetail />} />
              <Route path="/planning/production-plans/:id" element={<ProductionPlanDetail />} />
              <Route path="/planning/lots" element={<ProductionLots />} />

              {/* Director routes */}
              <Route path="/director/contract-approval" element={<ContractApproval />} />
              <Route path="/director/rfqs" element={<DirectorRfqList />} />

              {/* Sales routes */}
              <Route path="/sales/rfqs" element={<MyRfqs />} />
              <Route path="/sales/contracts" element={<ContractUpload />} />

              {/* Admin routes */}
              <Route path="/admin/users" element={<AdminUserManagement />} />
              <Route path="/admin/customers" element={<AdminCustomerManagement />} />

            </Routes>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;