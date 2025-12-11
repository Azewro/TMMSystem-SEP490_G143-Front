import React from 'react';
import '../../styles/Dashboard.css';

const STAGE_NAMES = {
    WARPING: 'Cuồng mắc',
    WEAVING: 'Dệt',
    DYEING: 'Nhuộm',
    CUTTING: 'Cắt',
    HEMMING: 'May',
    PACKAGING: 'Đóng gói'
};

const STAGE_ORDER = ['WARPING', 'WEAVING', 'DYEING', 'CUTTING', 'HEMMING', 'PACKAGING'];

/**
 * Stage progress matrix showing status counts by stage type
 * 
 * @param {Object} stageProgress - Map of stageType to status counts
 */
const StageProgressMatrix = ({ stageProgress }) => {
    if (!stageProgress || Object.keys(stageProgress).length === 0) {
        return (
            <div className="stage-matrix">
                <p className="text-center text-muted py-4">Không có dữ liệu công đoạn</p>
            </div>
        );
    }

    return (
        <div className="stage-matrix">
            <table>
                <thead>
                    <tr>
                        <th>Trạng thái</th>
                        {STAGE_ORDER.map(stage => (
                            <th key={stage}>{STAGE_NAMES[stage] || stage}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Đang làm</td>
                        {STAGE_ORDER.map(stage => (
                            <td key={stage}>
                                <span className="count-cell in-progress">
                                    {stageProgress[stage]?.inProgress || 0}
                                </span>
                            </td>
                        ))}
                    </tr>
                    <tr>
                        <td>Chờ QC</td>
                        {STAGE_ORDER.map(stage => (
                            <td key={stage}>
                                <span className="count-cell waiting-qc">
                                    {stageProgress[stage]?.waitingQC || 0}
                                </span>
                            </td>
                        ))}
                    </tr>
                    <tr>
                        <td>Hoàn thành</td>
                        {STAGE_ORDER.map(stage => (
                            <td key={stage}>
                                <span className="count-cell completed">
                                    {stageProgress[stage]?.completed || 0}
                                </span>
                            </td>
                        ))}
                    </tr>
                    <tr>
                        <td>Lỗi</td>
                        {STAGE_ORDER.map(stage => (
                            <td key={stage}>
                                <span className="count-cell failed">
                                    {stageProgress[stage]?.failed || 0}
                                </span>
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default StageProgressMatrix;
