import React from 'react';
import { Container, Card } from 'react-bootstrap';
import { Navigate } from 'react-router-dom';

const RegisterPage = () => {
  // Redirect to login since registration isn't implemented yet
  return <Navigate to="/login" replace />;
};

export default RegisterPage;