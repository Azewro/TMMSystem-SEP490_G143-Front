import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Badge, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
    FaClipboardCheck,
    FaFileContract,
    FaClipboardList,
    FaChartLine,
    FaIndustry,
    FaTruck,
    FaArrowRight,
    FaExclamationCircle,
    FaChartBar
} from 'react-icons/fa';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { dashboardService } from '../../api/dashboardService';

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
        if (!value) return '0 đ';
        const num = parseFloat(value);
        if (num >= 1000000000) {
            return `${(num / 1000000000).toFixed(1)} tỷ`;
        }
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(0)} triệu`;
        }
        return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
    };

    // Status label mapping for production orders
    const statusLabels = {
        'IN_PROGRESS': { label: 'Đang sản xuất', variant: 'primary' },
        'COMPLETED': { label: 'Hoàn thành', variant: 'success' },
        'WAITING_PRODUCTION': { label: 'Chờ sản xuất', variant: 'secondary' },
        'WAITING_MATERIAL_APPROVAL': { label: 'Chờ duyệt NVL', variant: 'warning' },
        'READY_SUPPLEMENTARY': { label: 'Sẵn sàng SX bổ sung', variant: 'info' },
        'SUPPLEMENTARY_CREATED': { label: 'Đã tạo lệnh bổ sung', variant: 'info' },
        'PENDING_APPROVAL': { label: 'Chờ duyệt', variant: 'warning' },
        'APPROVED': { label: 'Đã duyệt', variant: 'success' },
        'QC_IN_PROGRESS': { label: 'Đang QC', variant: 'primary' }
    };

    // Action Card - for items requiring Director's attention
    const ActionCard = ({ icon: Icon, count, label, description, variant, onClick, urgent }) => (
        <Card
            className={`h-100 border-0 shadow-sm`}
            onClick={onClick}
            style={{
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                borderLeft: urgent ? '4px solid #dc3545' : undefined
            }}
            onMouseEnter={(e) => onClick && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => onClick && (e.currentTarget.style.transform = 'translateY(0)')}
        >
            <Card.Body className="d-flex align-items-center">
                <div
                    className={`d-flex align-items-center justify-content-center rounded-circle me-3`}
                    style={{
                        width: 56,
                        height: 56,
                        backgroundColor: `rgba(var(--bs-${variant}-rgb), 0.1)`,
                        flexShrink: 0
                    }}
                >
                    <Icon size={24} className={`text-${variant}`} />
                </div>
                <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2">
                        <span className="fs-3 fw-bold">{count}</span>
                        {count > 0 && urgent && (
                            <Badge bg="danger" pill>Cần xử lý</Badge>
                        )}
                    </div>
                    <div className="text-dark fw-medium">{label}</div>
                    {description && <div className="text-muted small">{description}</div>}
                </div>
                {onClick && (
                    <FaArrowRight className="text-muted" />
                )}
            </Card.Body>
        </Card>
    );

    // Stat Card - for informational metrics
    const StatCard = ({ icon: Icon, value, label, sublabel, variant = 'primary' }) => (
        <div className="d-flex align-items-center p-3 bg-white rounded shadow-sm h-100">
            <div
                className="d-flex align-items-center justify-content-center rounded me-3"
                style={{
                    width: 44,
                    height: 44,
                    backgroundColor: `rgba(var(--bs-${variant}-rgb), 0.1)`,
                    flexShrink: 0
                }}
            >
                <Icon size={20} className={`text-${variant}`} />
            </div>
            <div>
                <div className="fs-4 fw-bold" style={{ lineHeight: 1.2 }}>{value}</div>
                <div className="text-muted small">{label}</div>
                {sublabel && <div className="text-muted" style={{ fontSize: '0.75rem' }}>{sublabel}</div>}
            </div>
        </div>
    );

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

    // Calculate total pending items
    const totalPending = (data?.pendingProductionPlans || 0) + (data?.pendingContracts || 0);

    // Get max value for chart scaling
    const maxContractCount = data?.contractsByMonth
        ? Math.max(...data.contractsByMonth.map(m => m.count), 1)
        : 1;

    // Calculate total production orders
    const totalProductionOrders = data?.productionOrdersByStatus
        ? data.productionOrdersByStatus.reduce((sum, item) => sum + item.count, 0)
        : 0;

    return (
        <div>
            <Header />
            <div className="d-flex">
                <InternalSidebar userRole="director" />
                <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
                    <Container fluid className="p-4">
                        {/* Page Header */}
                        <div className="mb-4">
                            <h3 className="mb-1" style={{ fontWeight: 600 }}>Tổng quan Chỉ đạo</h3>
                            <p className="text-muted mb-0">
                                Chào mừng! Dưới đây là các công việc cần xử lý và tình hình kinh doanh.
                            </p>
                        </div>

                        {error && (
                            <Alert variant="danger" onClose={() => setError(null)} dismissible>
                                {error}
                            </Alert>
                        )}

                        {data && (
                            <>
                                {/* Section 1: Action Items */}
                                <Card className="shadow-sm mb-4">
                                    <Card.Header className="bg-white border-bottom">
                                        <div className="d-flex align-items-center">
                                            <FaExclamationCircle className={totalPending > 0 ? 'text-danger me-2' : 'text-secondary me-2'} />
                                            <span className="fw-semibold">Việc cần xử lý</span>
                                            {totalPending > 0 && (
                                                <Badge bg="danger" className="ms-2">{totalPending}</Badge>
                                            )}
                                        </div>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row className="g-3">
                                            <Col md={6}>
                                                <ActionCard
                                                    icon={FaClipboardCheck}
                                                    count={data.pendingProductionPlans || 0}
                                                    label="Kế hoạch sản xuất chờ duyệt"
                                                    description="Xem và duyệt kế hoạch"
                                                    variant={data.pendingProductionPlans > 0 ? 'danger' : 'secondary'}
                                                    onClick={() => navigate('/director/production-plan-approvals')}
                                                    urgent={data.pendingProductionPlans > 0}
                                                />
                                            </Col>
                                            <Col md={6}>
                                                <ActionCard
                                                    icon={FaFileContract}
                                                    count={data.pendingContracts || 0}
                                                    label="Hợp đồng chờ duyệt"
                                                    description="Xem và duyệt hợp đồng"
                                                    variant={data.pendingContracts > 0 ? 'danger' : 'secondary'}
                                                    onClick={() => navigate('/director/contract-approval')}
                                                    urgent={data.pendingContracts > 0}
                                                />
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                {/* Section 2: Business Overview */}
                                <Card className="shadow-sm mb-4">
                                    <Card.Header className="bg-white border-bottom">
                                        <div className="d-flex align-items-center">
                                            <FaChartLine className="text-primary me-2" />
                                            <span className="fw-semibold">Tình hình Kinh doanh</span>
                                        </div>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row className="g-3">
                                            <Col xs={6} lg={3}>
                                                <StatCard
                                                    icon={FaFileContract}
                                                    value={data.activeContracts || 0}
                                                    label="Hợp đồng đang thực hiện"
                                                    variant="primary"
                                                />
                                            </Col>
                                            <Col xs={6} lg={3}>
                                                <StatCard
                                                    icon={FaChartLine}
                                                    value={formatCurrency(data.expectedRevenue)}
                                                    label="Doanh thu kỳ vọng"
                                                    variant="success"
                                                />
                                            </Col>
                                            <Col xs={6} lg={3}>
                                                <StatCard
                                                    icon={FaTruck}
                                                    value={data.contractsNearDelivery || 0}
                                                    label="HĐ sắp đến hạn giao"
                                                    sublabel="Trong 7 ngày tới"
                                                    variant={data.contractsNearDelivery > 0 ? 'warning' : 'info'}
                                                />
                                            </Col>
                                            <Col xs={6} lg={3}>
                                                <StatCard
                                                    icon={FaIndustry}
                                                    value={data.activeProductionOrders || 0}
                                                    label="Lệnh SX đang chạy"
                                                    variant="info"
                                                />
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                {/* Section 3: Charts Row */}
                                <Row className="g-4">
                                    {/* Contracts by Month Chart */}
                                    <Col lg={7}>
                                        <Card className="shadow-sm h-100">
                                            <Card.Header className="bg-white border-bottom">
                                                <div className="d-flex align-items-center">
                                                    <FaChartBar className="text-info me-2" />
                                                    <span className="fw-semibold">Hợp đồng theo tháng (6 tháng gần nhất)</span>
                                                </div>
                                            </Card.Header>
                                            <Card.Body>
                                                {data.contractsByMonth && data.contractsByMonth.length > 0 ? (
                                                    <div>
                                                        {/* Simple bar chart using divs */}
                                                        <div className="d-flex align-items-end justify-content-between" style={{ height: 180 }}>
                                                            {data.contractsByMonth.map((month, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="d-flex flex-column align-items-center"
                                                                    style={{ flex: 1, maxWidth: 80 }}
                                                                >
                                                                    <div
                                                                        className="bg-primary rounded-top w-100 mx-1"
                                                                        style={{
                                                                            height: `${Math.max((month.count / maxContractCount) * 140, 4)}px`,
                                                                            minWidth: 40,
                                                                            maxWidth: 60,
                                                                            transition: 'height 0.3s ease'
                                                                        }}
                                                                        title={`${month.count} hợp đồng`}
                                                                    />
                                                                    <div className="text-center mt-2">
                                                                        <div className="fw-bold small">{month.count}</div>
                                                                        <div className="text-muted small">{month.month}</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {/* Revenue summary */}
                                                        <div className="border-top pt-3 mt-3">
                                                            <Row className="text-center">
                                                                {data.contractsByMonth.slice(-3).map((month, index) => (
                                                                    <Col key={index}>
                                                                        <div className="text-muted small">{month.month}</div>
                                                                        <div className="fw-medium">{formatCurrency(month.revenue)}</div>
                                                                    </Col>
                                                                ))}
                                                            </Row>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-muted py-4">
                                                        Chưa có dữ liệu hợp đồng
                                                    </div>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>

                                    {/* Production Orders by Status */}
                                    <Col lg={5}>
                                        <Card className="shadow-sm h-100">
                                            <Card.Header className="bg-white border-bottom">
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center">
                                                        <FaIndustry className="text-secondary me-2" />
                                                        <span className="fw-semibold">Lệnh sản xuất theo trạng thái</span>
                                                    </div>
                                                    <Badge bg="secondary">{totalProductionOrders} lệnh</Badge>
                                                </div>
                                            </Card.Header>
                                            <Card.Body>
                                                {data.productionOrdersByStatus && data.productionOrdersByStatus.length > 0 ? (
                                                    <div className="d-flex flex-column gap-3">
                                                        {data.productionOrdersByStatus.map((item, index) => {
                                                            const statusInfo = statusLabels[item.status] || {
                                                                label: item.label || item.status,
                                                                variant: 'secondary'
                                                            };
                                                            const percentage = totalProductionOrders > 0
                                                                ? Math.round((item.count / totalProductionOrders) * 100)
                                                                : 0;

                                                            return (
                                                                <div key={index}>
                                                                    <div className="d-flex justify-content-between mb-1">
                                                                        <span className="small">{statusInfo.label}</span>
                                                                        <span className="small fw-medium">{item.count}</span>
                                                                    </div>
                                                                    <ProgressBar
                                                                        now={percentage}
                                                                        variant={statusInfo.variant}
                                                                        style={{ height: 8 }}
                                                                    />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-muted py-4">
                                                        Chưa có lệnh sản xuất
                                                    </div>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </>
                        )}
                    </Container>
                </div>
            </div>
        </div>
    );
};

export default DirectorDashboard;
