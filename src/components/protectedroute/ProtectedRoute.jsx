import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { roleRoutes } from "../../services/roleRoutes";


const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  

  const storedUser = localStorage.getItem("user");
  if (!storedUser) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Lấy role của user
  const user = JSON.parse(storedUser);
  const userRole = user.role;
const currentPath = location.pathname;
  // Kiểm tra xem route hiện tại có được phép với role không
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
