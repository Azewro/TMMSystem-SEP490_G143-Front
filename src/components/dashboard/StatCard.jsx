import React from 'react';
import '../../styles/Dashboard.css';

/**
 * Reusable stat card component displaying a metric value with label
 * 
 * @param {string} icon - Emoji or icon component
 * @param {string|number} value - The metric value to display
 * @param {string} label - Label describing the metric
 * @param {string} sublabel - Optional secondary text
 * @param {string} variant - Color variant: 'urgent', 'warning', 'info', 'success'
 * @param {function} onClick - Click handler
 */
const StatCard = ({ icon, value, label, sublabel, variant = 'info', onClick }) => {
    return (
        <div className={`stat-card ${variant}`} onClick={onClick} role="button" tabIndex={0}>
            {icon && <div className="stat-card-icon">{icon}</div>}
            <div className="stat-card-value">{value}</div>
            <div className="stat-card-label">{label}</div>
            {sublabel && <div className="stat-card-sublabel">{sublabel}</div>}
        </div>
    );
};

export default StatCard;
