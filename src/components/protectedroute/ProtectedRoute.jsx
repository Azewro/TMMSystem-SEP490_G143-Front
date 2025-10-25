import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { roleRoutes } from "../../services/roleRoutes";


const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  

  const storedUser = localStorage.getItem("user");
  if (!storedUser) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  
  const user = JSON.parse(storedUser);
  const userRole = user.role;
const currentPath = location.pathname;
  
  const allowedRoutes = roleRoutes[userRole?.toUpperCase()] || [];
  const isAllowed = allowedRoutes.some(route =>
  currentPath.toLowerCase().startsWith(route.toLowerCase())
);


  if (!isAllowed) {
    return <Navigate to="/home" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
