import React from "react";
import "./Navbar.css";
import {
  FaHome,
  FaUsers,
  FaChartPie,
  FaEnvelope,
  FaCalendarAlt,
  FaUser,
  FaCog,
} from "react-icons/fa";

const Navbar = () => {
  return (
    <div className="sidebar">
      <ul className="sidebar-menu">
        <li className="sidebar-item active">
          <FaHome className="icon" />
          <span>Bảng Điều Khiển</span>
        </li>
        <li className="sidebar-item">
          <FaUsers className="icon" />
          <span>Quản Lý Tài Khoản</span>
        </li>
        <li className="sidebar-item">
          <FaChartPie className="icon" />
          <span>Tiêu Đề</span>
        </li>
        <li className="sidebar-item">
          <FaEnvelope className="icon" />
          <span>Tiêu Đề</span>
        </li>
        <li className="sidebar-item">
          <FaCalendarAlt className="icon" />
          <span>Tiêu Đề</span>
        </li>
        <li className="sidebar-item">
          <FaUser className="icon" />
          <span>Tiêu Đề</span>
        </li>
        <li className="sidebar-item">
          <FaCog className="icon" />
          <span>Tiêu Đề</span>
        </li>
      </ul>
    </div>
  );
};

export default Navbar;
