import React from 'react';
import '../../styles/Dashboard.css';

/**
 * Widget showing machine utilization with progress bar
 * 
 * @param {number} inUse - Count of machines in use
 * @param {number} available - Count of available machines
 * @param {number} maintenance - Count of machines in maintenance
 * @param {number} needMaintenanceSoon - Count needing maintenance soon
 */
const MachineStatusWidget = ({ inUse = 0, available = 0, maintenance = 0, needMaintenanceSoon = 0 }) => {
    const total = inUse + available + maintenance;

    const getPercent = (value) => {
        if (total === 0) return 0;
        return (value / total) * 100;
    };

    return (
        <div className="widget-card">
            <div className="widget-card-title">
                🔧 Trạng thái máy móc
            </div>

            {total > 0 ? (
                <>
                    <div className="machine-status-bar">
                        {inUse > 0 && (
                            <div
                                className="machine-status-segment in-use"
                                style={{ width: `${getPercent(inUse)}%` }}
                            >
                                {inUse}
                            </div>
                        )}
                        {available > 0 && (
                            <div
                                className="machine-status-segment available"
                                style={{ width: `${getPercent(available)}%` }}
                            >
                                {available}
                            </div>
                        )}
                        {maintenance > 0 && (
                            <div
                                className="machine-status-segment maintenance"
                                style={{ width: `${getPercent(maintenance)}%` }}
                            >
                                {maintenance}
                            </div>
                        )}
                    </div>

                    <div className="machine-status-legend">
                        <div className="machine-status-legend-item">
                            <span className="machine-status-legend-dot" style={{ backgroundColor: '#0d6efd' }}></span>
                            <span>Đang chạy: {inUse}</span>
                        </div>
                        <div className="machine-status-legend-item">
                            <span className="machine-status-legend-dot" style={{ backgroundColor: '#198754' }}></span>
                            <span>Sẵn sàng: {available}</span>
                        </div>
                        <div className="machine-status-legend-item">
                            <span className="machine-status-legend-dot" style={{ backgroundColor: '#ffc107' }}></span>
                            <span>Bảo trì: {maintenance}</span>
                        </div>
                    </div>

                    {needMaintenanceSoon > 0 && (
                        <div className="mt-3 text-warning small">
                            ⚠️ {needMaintenanceSoon} máy cần bảo trì trong 7 ngày tới
                        </div>
                    )}
                </>
            ) : (
                <p className="text-muted text-center">Không có dữ liệu máy</p>
            )}
        </div>
    );
};

export default MachineStatusWidget;
