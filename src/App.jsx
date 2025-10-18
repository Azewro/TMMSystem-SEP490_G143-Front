import { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Login from './pages/login/Login';


import AdminDashboard from './pages/admin/AdminDashboard';


import ForgotPassword from './pages/forgot/ForgotPassword';
import Blog from './pages/blog/Blog';
import Register from './pages/register/Register';
import MachineList from './pages/machine/MachineList';

import Home from './pages/customer/home/Home';
import QuoteRequest from './pages/customer/quoteRequest/QuoteRequest';

import QuoteRequestSale from './pages/sale/quoterequestsale/QuoteRequestSale';
import QuoteRequestDetailSale from './pages/sale/quoteRequestDetailSale/QuoteRequestDetailSale';
import QuoteSale from './pages/sale/quotesale/QuoteSale';
import QuoteDetailSale from './pages/sale/quoteDetailSale/QuoteDetailSale';
import OrderListSale from './pages/sale/orderlistsale/OrderListSale';
import Order from './pages/customer/order/Order';
import OrderDetail from './pages/customer/orderdetail/OrderDetail';
import QuoteRequestplanRoom from './pages/planRoom/quoterequestplanRoom/QuoteRequestplanRoom';
import QuoteRequestDetailplanRoom from './pages/planRoom/quoterequestdetailplanRoom/QuoteRequestDetailplanRoom';
import OrderListplanRoom from './pages/planRoom/orderlistplanRoom/OrderListplanRoom';
import OrderDetailplanRoom from './pages/planRoom/orderdetailplanRoom/OrderDetailplanRoom';
import ProductionOrderplanRoom from './pages/planRoom/productionorderplanRoom/ProductionOrderplanRoom';
import ProductionOrderDetailplanRoom from './pages/planRoom/productionorderdetailplanRoom/ProductionOrderDetailplanRoom';
import OrderDetailSale from './pages/sale/orderdetailsale/OrderDetailSale';
import OrderManager from './pages/manager/ordermanager/OrderManager';
import OrderDetailManager from './pages/manager/orderdetailmanager/OrderDetailManager';
import ProductionOrderManager from './pages/manager/productionordermanager/ProductionOrderManager';
import ProductionOrderDetailManager from './pages/manager/productionorderdetailmanager/ProductionOrderDetailManager';
import Header from './components/header/Header';
import ProtectedRoute from './components/protectedroute/ProtectedRoute';


function App() {


  return (
    <>
      <div>
        <BrowserRouter>
        <Header></Header>
        <Routes>
          <Route path="/machinelist" element={<MachineList />} />
          <Route path="/quotedetailsale" element={<QuoteDetailSale />} />
          <Route path="/quoterequestdetailplan" element={<QuoteRequestDetailplanRoom />} />
          <Route path="/quotesale" element={<QuoteSale />} />
          <Route path="/order" element={<Order />} />
          <Route path="/quoterequestsale" element={<QuoteRequestSale />} />
          <Route path="/quoterequestdetailsale" element={<QuoteRequestDetailSale />} />
          {/* <Route path="/" element={<Login />} />
          <Route path="/createuser" element={<CreateAccount />} />
          <Route path="/changepass" element={<ChangePass />} />
          <Route path="/dashbroad" element={<AdminDashboard />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/register" element={<Register />} />
          <Route path="/machinelist" element={<MachineList />} />
          <Route path="/createmachine" element={<CreateMachine />} />
          <Route path="/home" element={<Home />} />
          <Route path="/quote" element={<QuoteRequest />} />
          <Route path="/createquote" element={<CreateQuote />} />
          
          
          
          
          <Route path="/orderlistsale" element={<OrderListSale />} />
          
          <Route path="/orderdetail" element={<OrderDetail />} />
          <Route path="/quoterequestplan" element={<QuoteRequestplanRoom />} />
          
          <Route path="/orderlistplanRoom" element={<OrderListplanRoom />} />
          <Route path="/orderdetailplan" element={<OrderDetailplanRoom />} />
          <Route path="/productionorderplan" element={<ProductionOrderplanRoom />} />
          <Route path="/productionorderdetailplan" element={<ProductionOrderDetailplanRoom />} />
          <Route path="/orderdetailsale" element={<OrderDetailSale />} />
          <Route path="/ordermanager" element={<OrderManager />} />
          <Route path="/orderdetailmanager" element={<OrderDetailManager />} />
          <Route path="/productionordermanager" element={<ProductionOrderManager />} />
          <Route path="/productionorderdetailmanager" element={<ProductionOrderDetailManager />} /> */}
          <Route path="/" element={<Login />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="/blog" element={<Blog />} /> 
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route path="/dashbroad" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/createuser" element={
              <ProtectedRoute>
                
              </ProtectedRoute>
            } />

            {/* Customer routes */}
            <Route path="/home" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/quote" element={
              <ProtectedRoute>
                <QuoteRequest />
              </ProtectedRoute>
            } />
            
            {/* Sales routes */}
            <Route path="/quoterequestsale" element={
              <ProtectedRoute>
                <QuoteRequestSale />
              </ProtectedRoute>
            } />


        </Routes>
        </BrowserRouter>
      </div>      
    </>
  )
}

export default App