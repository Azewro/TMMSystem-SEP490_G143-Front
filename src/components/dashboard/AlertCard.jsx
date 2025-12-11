import React from 'react';
import '../../styles/Dashboard.css';

/**
 * Alert card component for displaying important notices/warnings
 * 
 * @param {string} icon - Emoji or icon component
 * @param {number} count - The count to display
 * @param {string} label - Description of the alert
 * @param {string} variant - Color variant: 'danger', 'warning', 'info'
 * @param {function} onClick - Click handler
 */
const AlertCard = ({ icon, count, label, variant = 'info', onClick }) => {
    return (
        <div className={`alert-card ${variant}`} onClick={onClick} role="button" tabIndex={0}>
            <div className="alert-card-icon">{icon}</div>
            <div className="alert-card-content">
                <div className="alert-card-value">{count}</div>
                <div className="alert-card-label">{label}</div>
            </div>
        </div>
    );
};

export default AlertCard;
