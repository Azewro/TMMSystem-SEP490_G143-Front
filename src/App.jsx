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
import ProtectedRoute from './components/common/ProtectedRoute';
import UnauthorizedPage from './pages/public/UnauthorizedPage';


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
import MachineDetail from './pages/technical/MachineDetail';
import TechnicalDefectList from './pages/technical/TechnicalDefectList';
import TechnicalDefectDetail from './pages/technical/TechnicalDefectDetail';

// Production Manager Pages
import MaterialStockManagement from './pages/productionManager/MaterialStockManagement';
import ProductionOrderList from './pages/productionManager/ProductionOrderList';
import ProductionOrderDetail from './pages/productionManager/ProductionOrderDetail';
import ProductionFiberRequests from './pages/productionManager/ProductionFiberRequests';
import ProductionFiberRequestDetail from './pages/productionManager/ProductionFiberRequestDetail';
import ProductionReworkOrders from './pages/productionManager/ProductionReworkOrders';
import ProductionReworkOrderDetail from './pages/productionManager/ProductionReworkOrderDetail';
import ProductionReworkStageDetail from './pages/productionManager/ProductionReworkStageDetail';
import StageProgressDetail from './pages/productionManager/StageProgressDetail';

// Production Leader Pages
import LeaderOrderList from './pages/productionLeader/LeaderOrderList';
import LeaderOrderDetail from './pages/productionLeader/LeaderOrderDetail';
import LeaderStageProgress from './pages/productionLeader/LeaderStageProgress';
import LeaderDefectList from './pages/productionLeader/LeaderDefectList';
import LeaderDefectDetail from './pages/productionLeader/LeaderDefectDetail';

// QA Pages
import QaOrderList from './pages/qa/QaOrderList';
import QaOrderDetail from './pages/qa/QaOrderDetail';
import QaStageQualityCheck from './pages/qa/QaStageQualityCheck';
import QaStageCheckResult from './pages/qa/QaStageCheckResult';
import QaScanHandler from './pages/qa/QaScanHandler';

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
              <Route path="/unauthorized" element={<UnauthorizedPage />} />



              {/* Internal routes - Shared access */}
              <Route path="/internal/dashboard" element={<ProtectedRoute><InternalDashboard /></ProtectedRoute>} />
              <Route path="/sales/quotations" element={<ProtectedRoute allowedRoles={['SALE STAFF', 'SALE', 'DIRECTOR']}><QuotesList /></ProtectedRoute>} />
              <Route path="/internal/quote-requests" element={<ProtectedRoute allowedRoles={['SALE STAFF', 'SALE', 'DIRECTOR']}><QuoteRequests /></ProtectedRoute>} />
              <Route path="/sales/quotations/:id" element={<ProtectedRoute allowedRoles={['SALE STAFF', 'SALE', 'DIRECTOR']}><QuoteDetail /></ProtectedRoute>} />
              <Route path="/internal/orders" element={<ProtectedRoute allowedRoles={['SALE STAFF', 'SALE', 'DIRECTOR', 'PLANNING DEPARTMENT', 'PLANNING']}><OrderList /></ProtectedRoute>} />
              <Route path="/internal/orders/:id" element={<ProtectedRoute allowedRoles={['SALE STAFF', 'SALE', 'DIRECTOR', 'PLANNING DEPARTMENT', 'PLANNING']}><OrderDetail /></ProtectedRoute>} />

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
              <Route path="/planning/rfqs" element={<ProtectedRoute allowedRoles={['PLANNING DEPARTMENT', 'PLANNING', 'PLANNER']}><PlanningRfqs /></ProtectedRoute>} />
              <Route path="/planning/rfqs/:id" element={<ProtectedRoute allowedRoles={['PLANNING DEPARTMENT', 'PLANNING', 'PLANNER']}><PlanningRFQDetail /></ProtectedRoute>} />
              <Route path="/planning/production-plans/:id" element={<ProtectedRoute allowedRoles={['PLANNING DEPARTMENT', 'PLANNING', 'PLANNER']}><ProductionPlanDetail /></ProtectedRoute>} />
              <Route path="/planning/lots" element={<ProtectedRoute allowedRoles={['PLANNING DEPARTMENT', 'PLANNING', 'PLANNER']}><ProductionLots /></ProtectedRoute>} />

              {/* Director routes */}
              <Route path="/director/contract-approval" element={<ProtectedRoute allowedRoles={['DIRECTOR']}><ContractApproval /></ProtectedRoute>} />
              <Route path="/director/rfqs" element={<ProtectedRoute allowedRoles={['DIRECTOR']}><DirectorRfqList /></ProtectedRoute>} />
              <Route path="/director/production-plan-approvals" element={<ProtectedRoute allowedRoles={['DIRECTOR']}><ProductionPlanApprovals /></ProtectedRoute>} />
              <Route path="/director/orders" element={<ProtectedRoute allowedRoles={['DIRECTOR']}><DirectorOrderList /></ProtectedRoute>} />

              {/* Sales routes */}
              <Route path="/sales/rfqs" element={<ProtectedRoute allowedRoles={['SALE STAFF', 'SALE']}><MyRfqs /></ProtectedRoute>} />
              <Route path="/sales/create-rfq" element={<ProtectedRoute allowedRoles={['SALE STAFF', 'SALE']}><CreateRfqForCustomer /></ProtectedRoute>} />
              <Route path="/sales/contracts" element={<ProtectedRoute allowedRoles={['SALE STAFF', 'SALE']}><ContractUpload /></ProtectedRoute>} />

              {/* Admin routes */}
              <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminUserManagement /></ProtectedRoute>} />
              <Route path="/admin/customers" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminCustomerManagement /></ProtectedRoute>} />

              {/* Technical routes */}
              <Route path="/technical/machines" element={<ProtectedRoute allowedRoles={['TECHNICAL DEPARTMENT', 'TECHNICAL']}><MachineManagement /></ProtectedRoute>} />
              <Route path="/technical/machines/:id" element={<ProtectedRoute allowedRoles={['TECHNICAL DEPARTMENT', 'TECHNICAL']}><MachineDetail /></ProtectedRoute>} />
              <Route path="/technical/defects" element={<ProtectedRoute allowedRoles={['TECHNICAL DEPARTMENT', 'TECHNICAL']}><TechnicalDefectList /></ProtectedRoute>} />
              <Route path="/technical/defects/:defectId" element={<ProtectedRoute allowedRoles={['TECHNICAL DEPARTMENT', 'TECHNICAL']}><TechnicalDefectDetail /></ProtectedRoute>} />

              {/* Production routes */}
              <Route path="/production/material-stock" element={<ProtectedRoute allowedRoles={['PRODUCTION MANAGER', 'PRODUCTION_MANAGER']}><MaterialStockManagement /></ProtectedRoute>} />
              <Route path="/production/orders" element={<ProtectedRoute allowedRoles={['PRODUCTION MANAGER', 'PRODUCTION_MANAGER']}><ProductionOrderList /></ProtectedRoute>} />
              <Route path="/production/orders/:orderId" element={<ProtectedRoute allowedRoles={['PRODUCTION MANAGER', 'PRODUCTION_MANAGER']}><ProductionOrderDetail /></ProtectedRoute>} />
              <Route path="/production/orders/:orderId/stages/:stageCode" element={<ProtectedRoute allowedRoles={['PRODUCTION MANAGER', 'PRODUCTION_MANAGER']}><StageProgressDetail /></ProtectedRoute>} />
              <Route path="/production/fiber-requests" element={<ProtectedRoute allowedRoles={['PRODUCTION MANAGER', 'PRODUCTION_MANAGER']}><ProductionFiberRequests /></ProtectedRoute>} />
              <Route path="/production/fiber-requests/:lotCode" element={<ProtectedRoute allowedRoles={['PRODUCTION MANAGER', 'PRODUCTION_MANAGER']}><ProductionFiberRequestDetail /></ProtectedRoute>} />
              <Route path="/production/rework-orders" element={<ProtectedRoute allowedRoles={['PRODUCTION MANAGER', 'PRODUCTION_MANAGER']}><ProductionReworkOrders /></ProtectedRoute>} />
              <Route path="/production/rework-orders/:orderId" element={<ProtectedRoute allowedRoles={['PRODUCTION MANAGER', 'PRODUCTION_MANAGER']}><ProductionReworkOrderDetail /></ProtectedRoute>} />
              <Route path="/production/rework-orders/:orderId/stages/:stageCode" element={<ProtectedRoute allowedRoles={['PRODUCTION MANAGER', 'PRODUCTION_MANAGER']}><ProductionReworkStageDetail /></ProtectedRoute>} />

              {/* Leader (product process leader) routes */}
              <Route path="/leader/orders" element={<ProtectedRoute allowedRoles={['PRODUCT PROCESS LEADER', 'PRODUCTION LEADER', 'PROCESS LEADER']}><LeaderOrderList /></ProtectedRoute>} />
              <Route path="/leader/orders/:orderId" element={<ProtectedRoute allowedRoles={['PRODUCT PROCESS LEADER', 'PRODUCTION LEADER', 'PROCESS LEADER']}><LeaderOrderDetail /></ProtectedRoute>} />
              <Route path="/leader/orders/:orderId/progress" element={<ProtectedRoute allowedRoles={['PRODUCT PROCESS LEADER', 'PRODUCTION LEADER', 'PROCESS LEADER']}><LeaderStageProgress /></ProtectedRoute>} />
              <Route path="/leader/defects" element={<ProtectedRoute allowedRoles={['PRODUCT PROCESS LEADER', 'PRODUCTION LEADER', 'PROCESS LEADER']}><LeaderDefectList /></ProtectedRoute>} />
              <Route path="/leader/defects/:defectId" element={<ProtectedRoute allowedRoles={['PRODUCT PROCESS LEADER', 'PRODUCTION LEADER', 'PROCESS LEADER']}><LeaderDefectDetail /></ProtectedRoute>} />

              {/* QA routes */}
              <Route path="/qa/orders" element={<ProtectedRoute allowedRoles={['QUALITY ASSURANCE', 'QA']}><QaOrderList /></ProtectedRoute>} />
              <Route path="/qa/orders/:orderId" element={<ProtectedRoute allowedRoles={['QUALITY ASSURANCE', 'QA']}><QaOrderDetail /></ProtectedRoute>} />
              <Route path="/qa/orders/:orderId/stages/:stageCode/check" element={<ProtectedRoute allowedRoles={['QUALITY ASSURANCE', 'QA']}><QaStageQualityCheck /></ProtectedRoute>} />
              <Route path="/qa/orders/:orderId/stages/:stageCode/result" element={<ProtectedRoute allowedRoles={['QUALITY ASSURANCE', 'QA']}><QaStageCheckResult /></ProtectedRoute>} />
              <Route path="/qa/scan/:token" element={<ProtectedRoute allowedRoles={['QUALITY ASSURANCE', 'QA', 'PRODUCTION MANAGER', 'PRODUCT PROCESS LEADER', 'PRODUCTION LEADER']}><QaScanHandler /></ProtectedRoute>} />

            </Routes>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;