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
        </Routes>
        </BrowserRouter>
      </div>      
    </>
  )
}

export default App
