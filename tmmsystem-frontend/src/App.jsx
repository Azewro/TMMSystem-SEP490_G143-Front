import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PlanningRFQDetail from './pages/planning/PlanningRFQDetail';
import QuoteManagement from './pages/internal/QuoteManagement';
import QuotesList from './pages/internal/QuotesList';
import CustomerQuotationDetail from './pages/customer/CustomerQuotationDetail';
import QuoteDetail from './pages/internal/QuoteDetail';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';

// Customer Pages
import CustomerDashboard from './pages/customer/Dashboard';
import QuoteRequest from './pages/customer/QuoteRequest';
import CustomerQuotations from './pages/customer/CustomerQuotations';

// Internal Staff Pages
import InternalDashboard from './pages/internal/Dashboard';
import QuoteRequests from './pages/internal/QuoteRequests';
import RFQDetail from './pages/internal/RFQDetail';

// Planning Department Pages
import PlanningQuoteRequests from './pages/planning/PlanningQuoteRequests';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="main-container">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            

            {/* Internal routes - NO AUTH GUARD */}
            <Route path="/internal/quotations" element={<QuotesList />} />
            <Route path="/internal/quotations/:id" element={<QuoteDetail />} />
            <Route path="/internal/quote-requests" element={<QuoteRequests />} />
            <Route path="/internal/rfqs/:id" element={<RFQDetail />} />

            {/* Customer routes - NO AUTH GUARD */}
            <Route path="/customer/dashboard" element={<CustomerDashboard />} />
            <Route path="/customer/quotations" element={<CustomerQuotations />} />
            <Route path="/customer/quotations/:id" element={<CustomerQuotationDetail />} />

            {/* Planning routes - NO AUTH GUARD */}
            <Route path="/planning/quote-requests" element={<PlanningQuoteRequests />} />
            <Route path="/planning/rfqs/:id" element={<PlanningRFQDetail />} />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
