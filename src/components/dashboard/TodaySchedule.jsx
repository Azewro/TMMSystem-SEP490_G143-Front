import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Dashboard.css';

/**
 * Today's production schedule list
 * 
 * @param {Array} scheduleItems - List of scheduled stage items
 */
const TodaySchedule = ({ scheduleItems = [] }) => {
    const navigate = useNavigate();

    const formatTime = (instant) => {
        if (!instant) return '--:--';
        try {
            const date = new Date(instant);
            return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '--:--';
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'WAITING': { label: 'Chờ', class: 'bg-secondary' },
            'IN_PROGRESS': { label: 'Đang làm', class: 'bg-primary' },
            'WAITING_QC': { label: 'Chờ QC', class: 'bg-warning' },
            'QC_IN_PROGRESS': { label: 'Đang QC', class: 'bg-info' },
            'COMPLETED': { label: 'Xong', class: 'bg-success' },
            'QC_FAILED': { label: 'Lỗi', class: 'bg-danger' }
        };
        return statusMap[status] || { label: status, class: 'bg-secondary' };
    };

    const handleItemClick = (item) => {
        // Navigate to stage detail if needed
        // navigate(`/production/stages/${item.stageId}`);
    };

    return (
        <div className="widget-card">
            <div className="widget-card-title">
                📅 Lịch sản xuất hôm nay
            </div>

            {scheduleItems.length > 0 ? (
                <ul className="today-schedule-list">
                    {scheduleItems.map((item, index) => {
                        const statusInfo = getStatusBadge(item.status);
                        return (
                            <li
                                key={item.stageId || index}
                                className="today-schedule-item"
                                onClick={() => handleItemClick(item)}
                            >
                                <div className="today-schedule-time">
                                    {formatTime(item.plannedStartAt)}
                                </div>
                                <div className="today-schedule-content">
                                    <div className="today-schedule-stage">
                                        {item.stageTypeName || item.stageType}
                                        <span className={`badge ${statusInfo.class} ms-2`} style={{ fontSize: '0.7rem' }}>
                                            {statusInfo.label}
                                        </span>
                                    </div>
                                    <div className="today-schedule-details">
                                        {item.poNumber && <span>{item.poNumber}</span>}
                                        {item.leaderName && <span> • {item.leaderName}</span>}
                                        {item.machineName && <span> • {item.machineName}</span>}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="text-muted text-center py-4">
                    Không có lịch sản xuất hôm nay
                </p>
            )}
        </div>
    );
};

export default TodaySchedule;
