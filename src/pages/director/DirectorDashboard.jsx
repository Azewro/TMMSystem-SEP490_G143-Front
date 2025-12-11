import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import StatCard from '../../components/dashboard/StatCard';
import { dashboardService } from '../../api/dashboardService';
import '../../styles/Dashboard.css';

const DirectorDashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const dashboardData = await dashboardService.getDirectorDashboard();
                setData(dashboardData);
            } catch (err) {
                console.error('Error fetching director dashboard:', err);
                setError(err.message || 'Không thể tải dữ liệu dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatCurrency = (value) => {
        if (!value) return '0';
        const billions = value / 1000000000;
        if (billions >= 1) {
            return `${billions.toFixed(1)} tỷ`;
        }
        const millions = value / 1000000;
        return `${millions.toFixed(0)} tr`;
    };

    if (loading) {
        return (
            <div>
                <Header />
                <div className="d-flex">
                    <InternalSidebar userRole="director" />
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
                <InternalSidebar userRole="director" />
                <div className="flex-grow-1 dashboard-container">
                    <Container fluid>
                        {/* Header */}
                        <div className="dashboard-header">
                            <h2>📊 Tổng quan Chỉ đạo</h2>
                            <p className="subtitle">Chào mừng! Dưới đây là tổng quan hoạt động kinh doanh và sản xuất.</p>
                        </div>

                        {error && (
                            <Alert variant="danger" onClose={() => setError(null)} dismissible>
                                {error}
                            </Alert>
                        )}

                        {data && (
                            <>
                                {/* Section: Việc cần xử lý */}
                                <div className="dashboard-section">
                                    <div className="dashboard-section-title">
                                        🔔 Việc cần xử lý
                                    </div>
                                    <div className="stat-cards-grid">
                                        <StatCard
                                            icon="📋"
                                            value={data.pendingProductionPlans || 0}
                                            label="Kế hoạch chờ duyệt"
                                            variant={data.pendingProductionPlans > 0 ? 'urgent' : 'info'}
                                            onClick={() => navigate('/director/production-plans')}
                                        />
                                        <StatCard
                                            icon="📄"
                                            value={data.pendingContracts || 0}
                                            label="Hợp đồng chờ duyệt"
                                            variant={data.pendingContracts > 0 ? 'urgent' : 'info'}
                                            onClick={() => navigate('/director/contracts')}
                                        />
                                        <StatCard
                                            icon="💰"
                                            value={data.pendingQuotations || 0}
                                            label="Báo giá cần review"
                                            variant={data.pendingQuotations > 0 ? 'warning' : 'info'}
                                            onClick={() => navigate('/director/quotations')}
                                        />
                                    </div>
                                </div>

                                {/* Section: Tổng quan Kinh doanh */}
                                <div className="dashboard-section">
                                    <div className="dashboard-section-title">
                                        📈 Tổng quan Kinh doanh
                                    </div>
                                    <div className="stat-cards-grid">
                                        <StatCard
                                            icon="📁"
                                            value={data.activeContracts || 0}
                                            label="Hợp đồng đang xử lý"
                                            variant="info"
                                        />
                                        <StatCard
                                            icon="💵"
                                            value={formatCurrency(data.expectedRevenue)}
                                            label="Doanh thu kỳ vọng"
                                            variant="success"
                                        />
                                        <StatCard
                                            icon="📦"
                                            value={data.contractsNearDelivery || 0}
                                            label="HĐ sắp giao (7 ngày)"
                                            variant={data.contractsNearDelivery > 3 ? 'warning' : 'info'}
                                        />
                                        <StatCard
                                            icon="🏭"
                                            value={data.activeProductionOrders || 0}
                                            label="Lệnh SX đang chạy"
                                            variant="info"
                                        />
                                    </div>
                                </div>

                                {/* Section: Hiệu suất Sản xuất */}
                                <div className="dashboard-section">
                                    <div className="dashboard-section-title">
                                        🏭 Hiệu suất Sản xuất
                                    </div>
                                    <div className="stat-cards-grid">
                                        <StatCard
                                            icon="✅"
                                            value={`${data.efficiencyRate || 0}%`}
                                            label="Hiệu suất hoàn thành"
                                            sublabel="% công đoạn hoàn thành"
                                            variant={data.efficiencyRate >= 80 ? 'success' : 'warning'}
                                        />
                                        <StatCard
                                            icon="❌"
                                            value={`${data.defectRate || 0}%`}
                                            label="Tỷ lệ lỗi"
                                            sublabel="% công đoạn QC fail"
                                            variant={data.defectRate <= 5 ? 'success' : 'urgent'}
                                        />
                                        <StatCard
                                            icon="🚚"
                                            value={`${data.onTimeDeliveryRate || 0}%`}
                                            label="Giao hàng đúng hạn"
                                            sublabel="% đơn hàng on-time"
                                            variant={data.onTimeDeliveryRate >= 90 ? 'success' : 'warning'}
                                        />
                                    </div>
                                </div>

                                {/* Section: Thống kê theo trạng thái */}
                                {data.productionOrdersByStatus && data.productionOrdersByStatus.length > 0 && (
                                    <div className="dashboard-section">
                                        <div className="dashboard-section-title">
                                            📊 Lệnh sản xuất theo trạng thái
                                        </div>
                                        <Row>
                                            {data.productionOrdersByStatus.map((item, index) => (
                                                <Col key={index} xs={6} md={4} lg={2} className="mb-3">
                                                    <div className="widget-card text-center">
                                                        <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#495057' }}>
                                                            {item.count}
                                                        </div>
                                                        <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                                                            {item.label}
                                                        </div>
                                                    </div>
                                                </Col>
                                            ))}
                                        </Row>
                                    </div>
                                )}
                            </>
                        )}
                    </Container>
                </div>
            </div>
        </div>
    );
};

export default DirectorDashboard;
