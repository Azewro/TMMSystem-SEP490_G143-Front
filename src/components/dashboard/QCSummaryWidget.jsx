import React from 'react';
import '../../styles/Dashboard.css';

/**
 * QC Summary widget showing pass rate and issue breakdown
 * 
 * @param {number} passRate - QC pass rate percentage
 * @param {number} newIssues - Count of new issues today
 * @param {number} minorIssues - Count of minor issues
 * @param {number} majorIssues - Count of major issues
 * @param {number} reworkStages - Count of stages in rework
 */
const QCSummaryWidget = ({ passRate = 100, newIssues = 0, minorIssues = 0, majorIssues = 0, reworkStages = 0 }) => {
    const getRateClass = () => {
        if (passRate >= 90) return 'good';
        if (passRate >= 70) return 'warning';
        return 'bad';
    };

    return (
        <div className="widget-card">
            <div className="widget-card-title">
                ✅ Chất lượng hôm nay
            </div>

            <div className={`qc-pass-rate ${getRateClass()}`}>
                {passRate.toFixed(1)}%
                <div style={{ fontSize: '0.9rem', color: '#6c757d', fontWeight: 'normal' }}>
                    Tỷ lệ QC đạt
                </div>
            </div>

            <div className="qc-issues-grid">
                <div className="qc-issue-item">
                    <div className="qc-issue-value text-info">{newIssues}</div>
                    <div className="qc-issue-label">Issues mới</div>
                </div>
                <div className="qc-issue-item">
                    <div className="qc-issue-value text-warning">{minorIssues}</div>
                    <div className="qc-issue-label">Lỗi nhẹ</div>
                </div>
                <div className="qc-issue-item">
                    <div className="qc-issue-value text-danger">{majorIssues}</div>
                    <div className="qc-issue-label">Lỗi nặng</div>
                </div>
                <div className="qc-issue-item">
                    <div className="qc-issue-value text-secondary">{reworkStages}</div>
                    <div className="qc-issue-label">Đang xử lý</div>
                </div>
            </div>
        </div>
    );
};

export default QCSummaryWidget;
