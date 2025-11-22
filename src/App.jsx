import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Toaster } from 'react-hot-toast';

// Public Pages
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/auth/LoginPage';
import InternalLoginPage from './pages/auth/InternalLoginPage';
import CustomerForgotPassword from './pages/auth/CustomerForgotPassword';
import InternalForgotPassword from './pages/auth/InternalForgotPassword';


// Internal Pages
import PlanningRFQDetail from './pages/planning/PlanningRFQDetail';
import QuotesList from './pages/internal/QuotesList';
import QuoteDetail from './pages/internal/QuoteDetail';
import OrderList from './pages/internal/OrderList';
import OrderDetail from './pages/internal/OrderDetail';
import InternalDashboard from './pages/internal/Dashboard';
import QuoteRequests from './pages/internal/QuoteRequests';

// Customer Pages
import QuoteRequest from './pages/customer/QuoteRequest';
import CustomerRfqs from './pages/customer/CustomerRfqs';
import CustomerQuotations from './pages/customer/CustomerQuotations';
import CustomerQuotationDetail from './pages/customer/CustomerQuotationDetail';
import CustomerRfqDetail from './pages/customer/CustomerRfqDetail';
import WishlistPage from './pages/customer/WishlistPage';
import CustomerOrders from './pages/customer/CustomerOrders';
import CustomerOrderDetail from './pages/customer/CustomerOrderDetail';

// Planning Pages
import PlanningRfqs from './pages/planning/PlanningRfqs';
import ProductionPlanDetail from './pages/planning/ProductionPlanDetail';
import ProductionLots from './pages/planning/ProductionLots'; // Import new component

// Director Pages
import ContractApproval from './pages/director/ContractApproval';
import DirectorRfqList from './pages/director/DirectorRfqList'; // Import the new page
import ProductionPlanApprovals from './pages/director/ProductionPlanApprovals';
import DirectorOrderList from './pages/director/DirectorOrderList'; // Import DirectorOrderList

// Sales Pages
import MyRfqs from './pages/sales/MyRfqs';
import CreateRfqForCustomer from './pages/sales/CreateRfqPage'; // Import new page
import ContractUpload from './pages/internal/ContractUpload';

// Admin Pages
import AdminUserManagement from './pages/admin/AdminUserManagement';
import AdminCustomerManagement from './pages/admin/AdminCustomerManagement';

// Technical Pages
import MachineManagement from './pages/technical/MachineManagement';
import TechnicalDefectList from './pages/technical/TechnicalDefectList';
import TechnicalDefectDetail from './pages/technical/TechnicalDefectDetail';

// Production Pages
import MaterialStockManagement from './pages/production/MaterialStockManagement';
import ProductionOrderList from './pages/production/ProductionOrderList';
import ProductionOrderDetail from './pages/production/ProductionOrderDetail';
import ProductionFiberRequests from './pages/production/ProductionFiberRequests';
import ProductionFiberRequestDetail from './pages/production/ProductionFiberRequestDetail';
import ProductionReworkOrders from './pages/production/ProductionReworkOrders';
import ProductionReworkOrderDetail from './pages/production/ProductionReworkOrderDetail';
import StageProgressDetail from './pages/production/StageProgressDetail';
import LeaderOrderList from './pages/production/LeaderOrderList';
import LeaderStageProgress from './pages/production/LeaderStageProgress';
import LeaderDefectList from './pages/production/LeaderDefectList';
import LeaderDefectDetail from './pages/production/LeaderDefectDetail';
import QaOrderList from './pages/production/QaOrderList';
import QaOrderDetail from './pages/production/QaOrderDetail';
import QaStageQualityCheck from './pages/production/QaStageQualityCheck';
import QaStageCheckResult from './pages/production/QaStageCheckResult';

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
              <Route path="/forgot-password" element={<CustomerForgotPassword />} />
              <Route path="/internal-forgot-password" element={<InternalForgotPassword />} />



              {/* Internal routes - NO AUTH GUARD (for now) */}
              <Route path="/internal/dashboard" element={<InternalDashboard />} />
              <Route path="/sales/quotations" element={<QuotesList />} />
              <Route path="/internal/quote-requests" element={<QuoteRequests />} />
              <Route path="/sales/quotations/:id" element={<QuoteDetail />} />
              <Route path="/internal/orders" element={<OrderList />} />
              <Route path="/internal/orders/:id" element={<OrderDetail />} />

              {/* Customer routes */}
              <Route path="/customer/quote-request" element={<QuoteRequest />} />
              <Route path="/customer/rfqs" element={<CustomerRfqs />} />
              <Route path="/customer/quotations" element={<CustomerQuotations />} />
              <Route path="/customer/quotations/:id" element={<CustomerQuotationDetail />} />
              <Route path="/customer/rfqs/:id" element={<CustomerRfqDetail />} /> {/* New route */}
              <Route path="/wishlist" element={<WishlistPage />} />
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
              <Route path="/director/production-plan-approvals" element={<ProductionPlanApprovals />} />
              <Route path="/director/orders" element={<DirectorOrderList />} />

              {/* Sales routes */}
              <Route path="/sales/rfqs" element={<MyRfqs />} />
              <Route path="/sales/create-rfq" element={<CreateRfqForCustomer />} />
              <Route path="/sales/contracts" element={<ContractUpload />} />

              {/* Admin routes */}
              <Route path="/admin/users" element={<AdminUserManagement />} />
              <Route path="/admin/customers" element={<AdminCustomerManagement />} />

              {/* Technical routes */}
              <Route path="/technical/machines" element={<MachineManagement />} />
              <Route path="/technical/defects" element={<TechnicalDefectList />} />
              <Route path="/technical/defects/:defectId" element={<TechnicalDefectDetail />} />

              {/* Production routes */}
              <Route path="/production/material-stock" element={<MaterialStockManagement />} />
              <Route path="/production/orders" element={<ProductionOrderList />} />
              <Route path="/production/orders/:orderId" element={<ProductionOrderDetail />} />
              <Route path="/production/orders/:orderId/stages/:stageCode" element={<StageProgressDetail />} />
              <Route path="/production/fiber-requests" element={<ProductionFiberRequests />} />
              <Route path="/production/fiber-requests/:lotCode" element={<ProductionFiberRequestDetail />} />
              <Route path="/production/rework-orders" element={<ProductionReworkOrders />} />
              <Route path="/production/rework-orders/:orderId" element={<ProductionReworkOrderDetail />} />

              {/* Leader (product process leader) routes */}
              <Route path="/leader/orders" element={<LeaderOrderList />} />
              <Route path="/leader/orders/:orderId/progress" element={<LeaderStageProgress />} />
              <Route path="/leader/defects" element={<LeaderDefectList />} />
              <Route path="/leader/defects/:defectId" element={<LeaderDefectDetail />} />

              {/* QA routes */}
              <Route path="/qa/orders" element={<QaOrderList />} />
              <Route path="/qa/orders/:orderId" element={<QaOrderDetail />} />
              <Route path="/qa/orders/:orderId/stages/:stageCode/check" element={<QaStageQualityCheck />} />
              <Route path="/qa/orders/:orderId/stages/:stageCode/result" element={<QaStageCheckResult />} />

            </Routes>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;