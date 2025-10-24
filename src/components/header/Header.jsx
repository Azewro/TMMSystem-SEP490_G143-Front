import React from 'react';
import './Header.css';
import ProfilePopup from '../profilePopup/ProfilePopup';

const Header = () => {
    return (
        <div style={{ marginLeft: '380px' }}>
            <header className="header2">
                <input type="text" placeholder="Tìm kiếm sản phẩm..." />
                <div className="user-info">

                    <div className="user">
                        <i className="bell">🔔</i>
                    </div>
                    <ProfilePopup />
                </div>
            </header >
        </div >
    );
};

export default Header;