import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Toaster } from 'react-hot-toast';

// Public Pages
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/auth/LoginPage';
import InternalLoginPage from './pages/auth/InternalLoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Internal Pages
import PlanningRFQDetail from './pages/planning/PlanningRFQDetail';
import QuotesList from './pages/internal/QuotesList';
import CustomerQuotationDetail from './pages/customer/CustomerQuotationDetail';
import QuoteDetail from './pages/internal/QuoteDetail';
import OrderList from './pages/internal/OrderList';
import OrderDetail from './pages/internal/OrderDetail';
import InternalDashboard from './pages/internal/Dashboard';
import QuoteRequests from './pages/internal/QuoteRequests';

// Customer Pages
import CustomerDashboard from './pages/customer/Dashboard';
import QuoteRequest from './pages/customer/QuoteRequest';
import CustomerQuoteRequests from './pages/customer/CustomerQuoteRequests';
import CustomerQuotations from './pages/customer/CustomerQuotations';
import CartPage from './pages/customer/CartPage';

// Planning Pages
import PlanningRfqs from './pages/planning/PlanningRfqs';

// Director Pages
import ContractApproval from './pages/director/ContractApproval';
import DirectorRfqList from './pages/director/DirectorRfqList'; // Import the new page

// Sales Pages
import MyRfqs from './pages/sales/MyRfqs';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="main-container">
            <Toaster position="top-right" reverseOrder={false} />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/internal-login" element={<InternalLoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              

              {/* Internal routes - NO AUTH GUARD (for now) */}
              <Route path="/internal/dashboard" element={<InternalDashboard />} />
              <Route path="/internal/quotations" element={<QuotesList />} />
              <Route path="/internal/quote-requests" element={<QuoteRequests />} />
              <Route path="/internal/quotes/:id" element={<QuoteDetail />} />
              <Route path="/internal/orders" element={<OrderList />} />
              <Route path="/internal/orders/:id" element={<OrderDetail />} />

              {/* Customer routes */}
              <Route path="/customer/dashboard" element={<CustomerDashboard />} />
              <Route path="/customer/quote-request" element={<QuoteRequest />} />
              <Route path="/customer/quote-requests" element={<CustomerQuoteRequests />} />
              <Route path="/customer/quotations" element={<CustomerQuotations />} />
              <Route path="/customer/quotations/:id" element={<CustomerQuotationDetail />} />
              <Route path="/cart" element={<CartPage />} />

              {/* Planning routes */}
              <Route path="/planning/rfqs" element={<PlanningRfqs />} />
              <Route path="/planning/rfqs/:id" element={<PlanningRFQDetail />} />

              {/* Director routes */}
              <Route path="/director/contract-approval" element={<ContractApproval />} />
              <Route path="/director/rfqs" element={<DirectorRfqList />} />

              {/* Sales routes */}
              <Route path="/sales/rfqs" element={<MyRfqs />} />

            </Routes>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;