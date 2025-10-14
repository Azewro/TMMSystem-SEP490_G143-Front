import { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Login from './pages/login/Login';

import AdminDashboard from './pages/admin/AdminDashboard';
import CreateAccount from './pages/admin/CreateAccount';
import ChangePass from './pages/changePass/ChangePass';
import ForgotPassword from './pages/forgot/ForgotPassword';
import Blog from './pages/blog/Blog';
import Register from './pages/register/Register';
import MachineList from './pages/machine/MachineList';
import CreateMachine from './pages/machine/CreateMachine';
import Home from './pages/customer/home/Home';
import QuoteRequest from './pages/customer/quoteRequest/QuoteRequest';
import CreateQuote from './pages/customer/createquote/CreateQuote';
import QuoteRequestSale from './pages/sale/quoterequestsale/QuoteRequestSale';
import QuoteRequestDetailSale from './pages/sale/quoteRequestDetailSale/QuoteRequestDetailSale';
import QuoteSale from './pages/sale/quotesale/QuoteSale';
import QuoteDetailSale from './pages/sale/quoteDetailSale/QuoteDetailSale';
import OrderListSale from './pages/sale/orderlistsale/OrderListSale';
import Order from './pages/customer/order/Order';
import OrderDetail from './pages/customer/orderdetail/OrderDetail';
import QuoteRequestplanRoom from './pages/planRoom/quoterequestplanRoom/QuoteRequestplanRoom';
import QuoteRequestDetailplanRoom from './pages/planRoom/quoterequestdetailplanRoom/QuoteRequestDetailplanRoom';


function App() {


  return (
    <>
      <div>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
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
          <Route path="/quoterequestsale" element={<QuoteRequestSale />} />
          <Route path="/quoterequestdetailsale" element={<QuoteRequestDetailSale />} />
          <Route path="/quotesale" element={<QuoteSale />} />
          <Route path="/quotedetailsale" element={<QuoteDetailSale />} />
          <Route path="/orderlistsale" element={<OrderListSale />} />
          <Route path="/order" element={<Order />} />
          <Route path="/orderdetail" element={<OrderDetail />} />
          <Route path="/quoterequestplan" element={<QuoteRequestplanRoom />} />
          <Route path="/quoterequestdetailplan" element={<QuoteRequestDetailplanRoom />} />

        </Routes>
        </BrowserRouter>
      </div>      
    </>
  )
}

export default App