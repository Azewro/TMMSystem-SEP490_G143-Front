// src/components/common/InternalLayout.jsx
import React, { useState } from 'react';
import { FaBars } from 'react-icons/fa';
import Header from './Header';
import InternalSidebar from './InternalSidebar';
import { useIsMobile } from '../../utils/useMediaQuery';

/**
 * Layout wrapper for internal pages with sidebar
 * Handles sidebar state management and mobile toggle
 */
const InternalLayout = ({ children, userRole }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isMobile = useIsMobile();

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    return (
        <div>
            <Header>
                {/* Mobile menu toggle button */}
                {isMobile && (
                    <button
                        className="mobile-menu-toggle me-2"
                        onClick={toggleSidebar}
                        aria-label="Toggle menu"
                    >
                        <FaBars size={20} />
                    </button>
                )}
            </Header>

            <div className="d-flex">
                <InternalSidebar
                    userRole={userRole}
                    isOpen={sidebarOpen}
                    onClose={closeSidebar}
                />

                <div className="flex-grow-1 content-area" style={{ backgroundColor: '#f8f9fa' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default InternalLayout;
