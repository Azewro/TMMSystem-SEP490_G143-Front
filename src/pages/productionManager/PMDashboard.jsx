import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import AlertCard from '../../components/dashboard/AlertCard';
import StatCard from '../../components/dashboard/StatCard';
import StageProgressMatrix from '../../components/dashboard/StageProgressMatrix';
import MachineStatusWidget from '../../components/dashboard/MachineStatusWidget';
import QCSummaryWidget from '../../components/dashboard/QCSummaryWidget';
import TodaySchedule from '../../components/dashboard/TodaySchedule';
import { dashboardService } from '../../api/dashboardService';
import '../../styles/Dashboard.css';

const PMDashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const dashboardData = await dashboardService.getPMDashboard();
                setData(dashboardData);
            } catch (err) {
                console.error('Error fetching PM dashboard:', err);
                setError(err.message || 'Không thể tải dữ liệu dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div>
                <Header />
                <div className="d-flex">
                    <InternalSidebar userRole="production" />
                    <div className="flex-grow-1 d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 70px)' }}>
                        <Spinner animation="border" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Header />
            <div className="d-flex">
                <InternalSidebar userRole="production" />
                <div className="flex-grow-1 dashboard-container">
                    <Container fluid>
                        {/* Header */}
                        <div className="dashboard-header">
                            <h2>🏭 Bảng điều khiển Sản xuất</h2>
                            <p className="subtitle">Tổng quan tiến độ sản xuất, máy móc, và chất lượng.</p>
                        </div>

                        {error && (
                            <Alert variant="danger" onClose={() => setError(null)} dismissible>
                                {error}
                            </Alert>
                        )}

                        {data && (
                            <>
                                {/* Section: Cảnh báo */}
                                <div className="dashboard-section">
                                    <div className="dashboard-section-title">
                                        🚨 Cảnh báo cần xử lý
                                    </div>
                                    <Row className="g-3">
                                        <Col xs={6} lg={3}>
                                            <AlertCard
                                                icon="🔴"
                                                count={data.overdueStages || 0}
                                                label="Công đoạn trễ tiến độ"
                                                variant={data.overdueStages > 0 ? 'danger' : 'info'}
                                                onClick={() => navigate('/production/orders')}
                                            />
                                        </Col>
                                        <Col xs={6} lg={3}>
                                            <AlertCard
                                                icon="🟠"
                                                count={data.qcFailedStages || 0}
                                                label="QC không đạt"
                                                variant={data.qcFailedStages > 0 ? 'danger' : 'info'}
                                                onClick={() => navigate('/production/orders')}
                                            />
                                        </Col>
                                        <Col xs={6} lg={3}>
                                            <AlertCard
                                                icon="🟡"
                                                count={data.pendingMaterialRequests || 0}
                                                label="Yêu cầu cấp sợi"
                                                variant={data.pendingMaterialRequests > 0 ? 'warning' : 'info'}
                                                onClick={() => navigate('/production/fiber-requests')}
                                            />
                                        </Col>
                                        <Col xs={6} lg={3}>
                                            <AlertCard
                                                icon="🟡"
                                                count={data.pendingQualityIssues || 0}
                                                label="Issues chưa xử lý"
                                                variant={data.pendingQualityIssues > 0 ? 'warning' : 'info'}
                                            />
                                        </Col>
                                    </Row>
                                </div>

                                {/* Section: Tiến độ Công đoạn */}
                                <div className="dashboard-section">
                                    <div className="dashboard-section-title">
                                        📦 Tiến độ Công đoạn
                                    </div>
                                    <StageProgressMatrix stageProgress={data.stageProgress} />
                                </div>

                                {/* Section: Tổng quan Lệnh sản xuất */}
                                <div className="dashboard-section">
                                    <div className="dashboard-section-title">
                                        📋 Tổng quan Lệnh sản xuất
                                    </div>
                                    <div className="stat-cards-grid">
                                        <StatCard
                                            icon="📁"
                                            value={data.totalActiveOrders || 0}
                                            label="Tổng lệnh đang xử lý"
                                            variant="info"
                                            onClick={() => navigate('/production/orders')}
                                        />
                                        <StatCard
                                            icon="⚡"
                                            value={data.ordersInProgress || 0}
                                            label="Đang sản xuất"
                                            variant="info"
                                        />
                                        <StatCard
                                            icon="📦"
                                            value={data.ordersWaitingMaterial || 0}
                                            label="Chờ duyệt NVL"
                                            variant={data.ordersWaitingMaterial > 0 ? 'warning' : 'info'}
                                        />
                                        <StatCard
                                            icon="✅"
                                            value={data.ordersCompleted || 0}
                                            label="Hoàn thành"
                                            variant="success"
                                        />
                                    </div>
                                </div>

                                {/* Section: Máy móc & Nhân sự */}
                                <div className="dashboard-section">
                                    <Row className="g-3">
                                        <Col lg={6}>
                                            <MachineStatusWidget
                                                inUse={data.machinesInUse}
                                                available={data.machinesAvailable}
                                                maintenance={data.machinesMaintenance}
                                                needMaintenanceSoon={data.machinesNeedMaintenanceSoon}
                                            />
                                        </Col>
                                        <Col lg={6}>
                                            <div className="widget-card">
                                                <div className="widget-card-title">
                                                    👥 Nhân sự
                                                </div>
                                                <Row>
                                                    <Col xs={6}>
                                                        <div className="text-center py-3">
                                                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0d6efd' }}>
                                                                {data.activeLeaders || 0}
                                                            </div>
                                                            <div className="text-muted small">Leaders đang làm việc</div>
                                                        </div>
                                                    </Col>
                                                    <Col xs={6}>
                                                        <div className="text-center py-3">
                                                            <div style={{
                                                                fontSize: '2rem',
                                                                fontWeight: 700,
                                                                color: data.unassignedStages > 0 ? '#ffc107' : '#198754'
                                                            }}>
                                                                {data.unassignedStages || 0}
                                                            </div>
                                                            <div className="text-muted small">Stages chưa phân công</div>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </div>
                                        </Col>
                                    </Row>
                                </div>

                                {/* Section: Chất lượng & Lịch hôm nay */}
                                <div className="dashboard-section">
                                    <Row className="g-3">
                                        <Col lg={5}>
                                            <QCSummaryWidget
                                                passRate={data.qcPassRate}
                                                newIssues={data.newIssues}
                                                minorIssues={data.minorIssues}
                                                majorIssues={data.majorIssues}
                                                reworkStages={data.reworkStages}
                                            />
                                        </Col>
                                        <Col lg={7}>
                                            <TodaySchedule scheduleItems={data.todaySchedule} />
                                        </Col>
                                    </Row>
                                </div>
                            </>
                        )}
                    </Container>
                </div>
            </div>
        </div>
    );
};

export default PMDashboard;
