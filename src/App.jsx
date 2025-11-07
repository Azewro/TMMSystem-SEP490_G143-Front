import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Public Pages
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import InternalLoginPage from './pages/auth/InternalLoginPage'; // Import new login page

// Internal Pages
import PlanningRFQDetail from './pages/planning/PlanningRFQDetail';
import QuotesList from './pages/internal/QuotesList';
import CustomerQuotationDetail from './pages/customer/CustomerQuotationDetail';
import QuoteDetail from './pages/internal/QuoteDetail';
import OrderList from './pages/internal/OrderList';
import OrderDetail from './pages/internal/OrderDetail';
import InternalDashboard from './pages/internal/Dashboard';
import QuoteRequests from './pages/internal/QuoteRequests';
import RFQDetail from './pages/internal/RFQDetail';

// Customer Pages
import CustomerDashboard from './pages/customer/Dashboard';
import QuoteRequest from './pages/customer/QuoteRequest';
import CustomerQuoteRequests from './pages/customer/CustomerQuoteRequests';

// Planning Pages
import PlanningQuoteRequests from './pages/planning/PlanningQuoteRequests';

// Director Pages
import ContractApproval from './pages/director/ContractApproval';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="main-container">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/internal-login" element={<InternalLoginPage />} /> {/* Add internal login route */}
            <Route path="/register" element={<RegisterPage />} />
            

            {/* Internal routes - NO AUTH GUARD (for now) */}
            <Route path="/internal/dashboard" element={<InternalDashboard />} />
            <Route path="/internal/quotations" element={<QuotesList />} />
            <Route path="/internal/quotations/:id" element={<QuoteDetail />} />
            <Route path="/internal/orders" element={<OrderList />} />
            <Route path="/internal/orders/:id" element={<OrderDetail />} />
            <Route path="/internal/quote-requests" element={<QuoteRequests />} />
            <Route path="/internal/rfqs/:id" element={<RFQDetail />} />

            {/* Customer routes - NO AUTH GUARD (for now) */}
            <Route path="/customer/dashboard" element={<CustomerDashboard />} />
            <Route path="/customer/quote-requests" element={<CustomerQuoteRequests />} />
            <Route path="/customer/quotations/:id" element={<CustomerQuotationDetail />} />
            <Route path="/customer/quote-request" element={<QuoteRequest />} />

            {/* Planning routes - NO AUTH GUARD (for now) */}
            <Route path="/planning/quote-requests" element={<PlanningQuoteRequests />} />
            <Route path="/planning/rfqs/:id" element={<PlanningRFQDetail />} />

            {/* Director routes - NO AUTH GUARD (for now) */}
            <Route path="/director/contract-approval" element={<ContractApproval />} />

            {/* Fallback redirect to home */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
