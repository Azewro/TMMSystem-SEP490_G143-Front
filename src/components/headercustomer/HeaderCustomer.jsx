import React from 'react';
import './HeaderCustomer.css';
import { FaUser } from "react-icons/fa";
import ProfilePopup from '../ProfilePopup/ProfilePopup';
const HeaderCustomer = () => {
    return (
        <div style={{marginLeft:'380px'}}>
            <header className="header2">
          <input type="text" placeholder="Tìm kiếm sản phẩm..." />
          <div className="user-info">
            
            <div className="user">
              <i className="bell">🔔</i>
              
              
            </div>
          </div>
        </header>
            
        </div>
    );
};

export default HeaderCustomer;