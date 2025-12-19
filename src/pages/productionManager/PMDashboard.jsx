import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Badge, ProgressBar, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
    FaExclamationTriangle,
    FaCheckCircle,
    FaClock,
    FaCogs,
    FaBoxes,
    FaClipboardList,
    FaUsers,
    FaTools,
    FaChartLine,
    FaCalendarDay
} from 'react-icons/fa';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { dashboardService } from '../../api/dashboardService';
import { useWebSocketContext } from '../../context/WebSocketContext';

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

    // WebSocket subscription for real-time updates
    const { subscribe } = useWebSocketContext();
    useEffect(() => {
        const unsubscribe = subscribe('/topic/updates', (update) => {
            if (['PRODUCTION_ORDER', 'PRODUCTION_STAGE', 'QUALITY_ISSUE', 'MATERIAL_REQUEST'].includes(update.entity)) {
                console.log('[PMDashboard] Received update, refreshing...', update);
                dashboardService.getPMDashboard().then(setData).catch(console.error);
            }
        });
        return () => unsubscribe();
    }, [subscribe]);

    // Stage type Vietnamese mapping
    const stageTypeNames = {
        'WARPING': 'Cuồng mắc',
        'WEAVING': 'Dệt',
        'DYEING': 'Nhuộm',
        'CUTTING': 'Cắt',
        'HEMMING': 'May viền',
        'PACKAGING': 'Đóng gói'
    };

    // Alert card component
    const AlertItem = ({ icon: Icon, count, label, variant = 'secondary', onClick }) => (
        <div
            className={`d-flex align-items-center p-3 bg-white rounded border ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
            style={{
                cursor: onClick ? 'pointer' : 'default',
                transition: 'box-shadow 0.2s',
                borderLeft: count > 0 ? `4px solid var(--bs-${variant})` : undefined
            }}
            onMouseEnter={(e) => onClick && (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
            onMouseLeave={(e) => onClick && (e.currentTarget.style.boxShadow = 'none')}
        >
            <div className="me-3">
                <Icon size={24} className={`text-${variant}`} />
            </div>
            <div className="flex-grow-1">
                <div className="fw-bold fs-5">{count}</div>
                <div className="text-muted small">{label}</div>
            </div>
            {count > 0 && (
                <Badge bg={variant} pill>{count}</Badge>
            )}
        </div>
    );

    // Stat card component
    const StatItem = ({ icon: Icon, value, label, variant = 'primary', onClick }) => (
        <div
            className={`d-flex align-items-center p-3 bg-white rounded border`}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <div
                className="d-flex align-items-center justify-content-center rounded me-3"
                style={{
                    width: 44,
                    height: 44,
                    backgroundColor: `rgba(var(--bs-${variant}-rgb), 0.1)`
                }}
            >
                <Icon size={20} className={`text-${variant}`} />
            </div>
            <div>
                <div className="fw-bold fs-4" style={{ lineHeight: 1.2 }}>{value}</div>
                <div className="text-muted small">{label}</div>
            </div>
        </div>
    );

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
                <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
                    <Container fluid className="p-4">
                        {/* Page Header */}
                        <div className="mb-4">
                            <h3 className="mb-1" style={{ fontWeight: 600 }}>Bảng điều khiển Sản xuất</h3>
                            <p className="text-muted mb-0">Tổng quan tiến độ sản xuất, máy móc, và chất lượng.</p>
                        </div>

                        {error && (
                            <Alert variant="danger" onClose={() => setError(null)} dismissible>
                                {error}
                            </Alert>
                        )}

                        {data && (
                            <>
                                {/* Section: Cảnh báo */}
                                <Card className="shadow-sm mb-4">
                                    <Card.Header className="bg-white">
                                        <div className="d-flex align-items-center">
                                            <FaExclamationTriangle className="text-warning me-2" />
                                            <span className="fw-semibold">Cảnh báo cần xử lý</span>
                                        </div>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row className="g-3">
                                            <Col xs={6} lg={3}>
                                                <AlertItem
                                                    icon={FaClock}
                                                    count={data.overdueStages || 0}
                                                    label="Công đoạn trễ tiến độ"
                                                    variant={data.overdueStages > 0 ? 'danger' : 'secondary'}
                                                    onClick={() => navigate('/production/orders')}
                                                />
                                            </Col>
                                            <Col xs={6} lg={3}>
                                                <AlertItem
                                                    icon={FaExclamationTriangle}
                                                    count={data.qcFailedStages || 0}
                                                    label="QC không đạt"
                                                    variant={data.qcFailedStages > 0 ? 'danger' : 'secondary'}
                                                    onClick={() => navigate('/production/orders')}
                                                />
                                            </Col>
                                            <Col xs={6} lg={3}>
                                                <AlertItem
                                                    icon={FaBoxes}
                                                    count={data.pendingMaterialRequests || 0}
                                                    label="Yêu cầu cấp sợi"
                                                    variant={data.pendingMaterialRequests > 0 ? 'warning' : 'secondary'}
                                                    onClick={() => navigate('/production/fiber-requests')}
                                                />
                                            </Col>
                                            <Col xs={6} lg={3}>
                                                <AlertItem
                                                    icon={FaTools}
                                                    count={data.pendingQualityIssues || 0}
                                                    label="Vấn đề chưa xử lý"
                                                    variant={data.pendingQualityIssues > 0 ? 'warning' : 'secondary'}
                                                />
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                {/* Section: Tổng quan Lệnh sản xuất */}
                                <Card className="shadow-sm mb-4">
                                    <Card.Header className="bg-white">
                                        <div className="d-flex align-items-center">
                                            <FaClipboardList className="text-primary me-2" />
                                            <span className="fw-semibold">Tổng quan Lệnh sản xuất</span>
                                        </div>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row className="g-3">
                                            <Col xs={6} md={3}>
                                                <StatItem
                                                    icon={FaClipboardList}
                                                    value={data.totalActiveOrders || 0}
                                                    label="Tổng lệnh đang xử lý"
                                                    variant="primary"
                                                    onClick={() => navigate('/production/orders')}
                                                />
                                            </Col>
                                            <Col xs={6} md={3}>
                                                <StatItem
                                                    icon={FaCogs}
                                                    value={data.ordersInProgress || 0}
                                                    label="Đang sản xuất"
                                                    variant="info"
                                                />
                                            </Col>
                                            <Col xs={6} md={3}>
                                                <StatItem
                                                    icon={FaBoxes}
                                                    value={data.ordersWaitingMaterial || 0}
                                                    label="Chờ duyệt NVL"
                                                    variant={data.ordersWaitingMaterial > 0 ? 'warning' : 'secondary'}
                                                />
                                            </Col>
                                            <Col xs={6} md={3}>
                                                <StatItem
                                                    icon={FaCheckCircle}
                                                    value={data.ordersCompleted || 0}
                                                    label="Hoàn thành"
                                                    variant="success"
                                                />
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                {/* Section: Tiến độ Công đoạn & Máy móc */}
                                <Row className="g-4 mb-4">
                                    {/* Stage Progress */}
                                    {data.stageProgress && Object.keys(data.stageProgress).length > 0 && (
                                        <Col lg={6}>
                                            <Card className="shadow-sm h-100">
                                                <Card.Header className="bg-white">
                                                    <div className="d-flex align-items-center">
                                                        <FaChartLine className="text-info me-2" />
                                                        <span className="fw-semibold">Tiến độ Công đoạn</span>
                                                    </div>
                                                </Card.Header>
                                                <Card.Body>
                                                    <Table responsive size="sm" className="mb-0">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th>Công đoạn</th>
                                                                <th className="text-center">Đang chạy</th>
                                                                <th className="text-center">Chờ QC</th>
                                                                <th className="text-center">Hoàn thành</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {Object.entries(data.stageProgress).map(([stageName, counts]) => (
                                                                <tr key={stageName}>
                                                                    <td className="fw-medium">{stageTypeNames[stageName] || stageName}</td>
                                                                    <td className="text-center">
                                                                        <Badge bg="primary" pill>{counts.inProgress || 0}</Badge>
                                                                    </td>
                                                                    <td className="text-center">
                                                                        <Badge bg="warning" text="dark" pill>{counts.waitingQC || 0}</Badge>
                                                                    </td>
                                                                    <td className="text-center">
                                                                        <Badge bg="success" pill>{counts.completed || 0}</Badge>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    )}

                                    {/* Machine & Personnel */}
                                    <Col lg={6}>
                                        <Card className="shadow-sm h-100">
                                            <Card.Header className="bg-white">
                                                <div className="d-flex align-items-center">
                                                    <FaCogs className="text-secondary me-2" />
                                                    <span className="fw-semibold">Máy móc & Nhân sự</span>
                                                </div>
                                            </Card.Header>
                                            <Card.Body>
                                                {/* Machine Status */}
                                                <div className="mb-4">
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <span className="text-muted small">Tình trạng máy</span>
                                                    </div>
                                                    <ProgressBar style={{ height: 24 }}>
                                                        <ProgressBar
                                                            variant="primary"
                                                            now={(data.machinesInUse / (data.machinesInUse + data.machinesAvailable + data.machinesMaintenance || 1)) * 100}
                                                            label={`${data.machinesInUse || 0} đang dùng`}
                                                            key={1}
                                                        />
                                                        <ProgressBar
                                                            variant="success"
                                                            now={(data.machinesAvailable / (data.machinesInUse + data.machinesAvailable + data.machinesMaintenance || 1)) * 100}
                                                            label={`${data.machinesAvailable || 0} sẵn sàng`}
                                                            key={2}
                                                        />
                                                        <ProgressBar
                                                            variant="warning"
                                                            now={(data.machinesMaintenance / (data.machinesInUse + data.machinesAvailable + data.machinesMaintenance || 1)) * 100}
                                                            label={`${data.machinesMaintenance || 0} bảo trì`}
                                                            key={3}
                                                        />
                                                    </ProgressBar>
                                                    <div className="d-flex gap-3 mt-2">
                                                        <small><span className="badge bg-primary me-1">&nbsp;</span>Đang dùng</small>
                                                        <small><span className="badge bg-success me-1">&nbsp;</span>Sẵn sàng</small>
                                                        <small><span className="badge bg-warning me-1">&nbsp;</span>Bảo trì</small>
                                                    </div>
                                                </div>

                                                {/* Personnel */}
                                                <Row className="g-3">
                                                    <Col xs={6}>
                                                        <div className="text-center p-3 bg-light rounded">
                                                            <FaUsers size={24} className="text-primary mb-2" />
                                                            <div className="fw-bold fs-4">{data.activeLeaders || 0}</div>
                                                            <div className="text-muted small">Leaders đang làm việc</div>
                                                        </div>
                                                    </Col>
                                                    <Col xs={6}>
                                                        <div className="text-center p-3 bg-light rounded">
                                                            <FaClipboardList size={24} className={data.unassignedStages > 0 ? 'text-warning mb-2' : 'text-success mb-2'} />
                                                            <div className="fw-bold fs-4">{data.unassignedStages || 0}</div>
                                                            <div className="text-muted small">Stages chưa phân công</div>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                                {/* Section: QC & Today Schedule */}
                                <Row className="g-4">
                                    {/* QC Summary */}
                                    <Col lg={5}>
                                        <Card className="shadow-sm h-100">
                                            <Card.Header className="bg-white">
                                                <div className="d-flex align-items-center">
                                                    <FaCheckCircle className="text-success me-2" />
                                                    <span className="fw-semibold">Tổng hợp Chất lượng</span>
                                                </div>
                                            </Card.Header>
                                            <Card.Body>
                                                <div className="text-center mb-4">
                                                    <div
                                                        className={`fw-bold`}
                                                        style={{
                                                            fontSize: '3rem',
                                                            color: data.qcPassRate >= 95 ? '#198754' : data.qcPassRate >= 80 ? '#ffc107' : '#dc3545'
                                                        }}
                                                    >
                                                        {data.qcPassRate || 0}%
                                                    </div>
                                                    <div className="text-muted">Tỷ lệ QC Pass</div>
                                                </div>
                                                <Row className="g-2">
                                                    <Col xs={6}>
                                                        <div className="text-center p-2 bg-light rounded">
                                                            <div className="fw-bold text-info">{data.newIssues || 0}</div>
                                                            <div className="text-muted small">Lỗi mới</div>
                                                        </div>
                                                    </Col>
                                                    <Col xs={6}>
                                                        <div className="text-center p-2 bg-light rounded">
                                                            <div className="fw-bold text-warning">{data.minorIssues || 0}</div>
                                                            <div className="text-muted small">Lỗi nhẹ</div>
                                                        </div>
                                                    </Col>
                                                    <Col xs={6}>
                                                        <div className="text-center p-2 bg-light rounded">
                                                            <div className="fw-bold text-danger">{data.majorIssues || 0}</div>
                                                            <div className="text-muted small">Lỗi nặng</div>
                                                        </div>
                                                    </Col>
                                                    <Col xs={6}>
                                                        <div className="text-center p-2 bg-light rounded">
                                                            <div className="fw-bold text-secondary">{data.reworkStages || 0}</div>
                                                            <div className="text-muted small">Đang gia công lại</div>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </Card.Body>
                                        </Card>
                                    </Col>

                                    {/* Today Schedule */}
                                    <Col lg={7}>
                                        <Card className="shadow-sm h-100">
                                            <Card.Header className="bg-white">
                                                <div className="d-flex align-items-center">
                                                    <FaCalendarDay className="text-primary me-2" />
                                                    <span className="fw-semibold">Lịch hôm nay</span>
                                                </div>
                                            </Card.Header>
                                            <Card.Body style={{ maxHeight: 300, overflowY: 'auto' }}>
                                                {data.todaySchedule && data.todaySchedule.length > 0 ? (
                                                    <div>
                                                        {data.todaySchedule.map((item, index) => {
                                                            // Format time from plannedStartAt (Instant)
                                                            const time = item.plannedStartAt
                                                                ? new Date(item.plannedStartAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                                                                : '--:--';
                                                            // Match backend field names
                                                            const orderCode = item.poNumber || '';
                                                            const leader = item.leaderName || 'Chưa phân công';
                                                            const status = item.status || '';

                                                            return (
                                                                <div
                                                                    key={index}
                                                                    className="d-flex align-items-start py-2 border-bottom"
                                                                >
                                                                    <div className="text-muted small me-3" style={{ minWidth: 50 }}>
                                                                        {time}
                                                                    </div>
                                                                    <div className="flex-grow-1">
                                                                        <div className="fw-medium">{stageTypeNames[item.stageType] || item.stageTypeName || item.stageType}</div>
                                                                        <div className="text-muted small">
                                                                            {orderCode} • {leader}
                                                                        </div>
                                                                    </div>
                                                                    <Badge
                                                                        bg={status === 'COMPLETED' ? 'success' : status === 'IN_PROGRESS' ? 'primary' : 'secondary'}
                                                                        className="ms-2"
                                                                    >
                                                                        {status === 'COMPLETED' ? 'Xong' : status === 'IN_PROGRESS' ? 'Đang chạy' : 'Chờ'}
                                                                    </Badge>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-muted py-4">
                                                        Không có lịch hôm nay
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

export default PMDashboard;
