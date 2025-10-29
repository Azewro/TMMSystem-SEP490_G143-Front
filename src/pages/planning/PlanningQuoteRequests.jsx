import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Table, Button, Badge, Form, Alert, Spinner } from 'react-bootstrap';
import { FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import PlanningSidebar from '../../components/common/PlanningSidebar';
import { quoteService } from '../../api/quoteService';
import '../../styles/PlanningQuoteRequests.css';

const STATUS_LABELS = {
    SENT: { text: 'Đang chờ xử lý', color: 'warning' },
    RECEIVED_BY_PLANNING: { text: 'Đã nhận', color: 'info' },
    QUOTED: { text: 'Đã tạo báo giá', color: 'primary' },
    APPROVED: { text: 'Đã duyệt', color: 'success' },
    REJECTED: { text: 'Từ chối', color: 'danger' }
};

const filterOptions = [
    { value: 'ALL', label: 'Tất cả danh mục' },
    { value: 'SENT', label: 'Đang chờ xử lý' },
    { value: 'RECEIVED_BY_PLANNING', label: 'Đã nhận' },
    { value: 'QUOTED', label: 'Đã tạo báo giá' },
    { value: 'APPROVED', label: 'Đã duyệt' },
    { value: 'REJECTED', label: 'Từ chối' }
];

const PlanningQuoteRequests = () => {
    const navigate = useNavigate();
    const [rfqs, setRfqs] = useState([]);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPlanningRFQs = async () => {
            setLoading(true);
            setError('');

            try {
                const [allRfqs, customers] = await Promise.all([
                    quoteService.getAllQuoteRequests(),
                    quoteService.getAllCustomers()
                ]);

                const customerMap = new Map();
                customers.forEach((customer) => customerMap.set(customer.id, customer));

                const planningRfqs = allRfqs
                    .filter((rfq) => ['SENT', 'RECEIVED_BY_PLANNING', 'QUOTED'].includes(rfq.status))
                    .map((rfq) => {
                        const customer = customerMap.get(rfq.customerId);
                        return {
                            id: rfq.id,
                            code: rfq.rfqNumber || `RFQ-${rfq.id}`,
                            itemCount: rfq.details?.length || 0,
                            createdDate: rfq.createdAt ? new Date(rfq.createdAt).toLocaleDateString('vi-VN') : '—',
                            status: rfq.status,
                            customerName: customer?.contactPerson || `Khách hàng #${rfq.customerId}`
                        };
                    });

                setRfqs(planningRfqs.sort((a, b) => (b.id ?? 0) - (a.id ?? 0)));
            } catch (err) {
                console.error('Error fetching planning RFQs', err);
                setError(err.message || 'Không thể tải danh sách yêu cầu báo giá.');
            } finally {
                setLoading(false);
            }
        };

            fetchPlanningRFQs();
        }, []);

    const filteredRequests = useMemo(() => {
        if (statusFilter === 'ALL') return rfqs;
        return rfqs.filter((request) => request.status === statusFilter);
    }, [rfqs, statusFilter]);

    const handleViewDetails = (request) => {
        navigate(`/planning/rfq/${request.id}`);
    };

    return (
        <div className="planning-layout">
            <Header />

            <div className="d-flex">
                <PlanningSidebar />

                <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
                    <Container fluid className="p-4">
                        <div className="planning-quote-requests-page">
                            <div className="page-header mb-4">
                                <Row className="align-items-center">
                                    <Col>
                                        <h1 className="page-title mb-0">Danh sách yêu cầu báo giá</h1>
                                    </Col>
                                    <Col xs="auto">
                                        <Form.Select
                                            value={statusFilter}
                                            onChange={(event) => setStatusFilter(event.target.value)}
                                            className="status-filter"
                                            style={{ width: '220px' }}
                                        >
                                            {filterOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Col>
                                </Row>
                            </div>

                            {error && (
                                <Alert variant="danger" onClose={() => setError('')} dismissible>
                                    {error}
                                </Alert>
                            )}

                            <div className="table-card bg-white rounded shadow-sm">
                                <Table responsive className="planning-rfq-table mb-0">
                                    <thead className="table-header">
                                        <tr>
                                            <th className="text-center" style={{ width: '80px' }}>#</th>
                                            <th style={{ width: '150px' }}>Mã RFQ</th>
                                            <th className="text-center" style={{ width: '120px' }}>Số lượng sản phẩm</th>
                                            <th className="text-center" style={{ width: '150px' }}>Ngày tạo đơn</th>
                                            <th className="text-center" style={{ width: '180px' }}>Trạng thái</th>
                                            <th style={{ minWidth: '180px' }}>Khách hàng</th>
                                            <th className="text-center" style={{ width: '120px' }}>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={7} className="text-center py-4">
                                                    <Spinner animation="border" size="sm" className="me-2" /> Đang tải dữ liệu...
                                                </td>
                                            </tr>
                                        ) : filteredRequests.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center py-4 text-muted">
                                                    {statusFilter === 'ALL'
                                                        ? 'Chưa có yêu cầu báo giá nào được gửi đến.'
                                                        : 'Không có yêu cầu nào với trạng thái đã chọn.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredRequests.map((request, index) => {
                                                const config = STATUS_LABELS[request.status] || STATUS_LABELS.SENT;
                                                return (
                                                    <tr key={request.id} className="table-row">
                                                        <td className="text-center fw-bold">{index + 1}</td>
                                                        <td>
                                                            <span className="rfq-code">{request.code}</span>
                                                        </td>
                                                        <td className="text-center">
                                                            <span className="product-count">{request.itemCount}</span>
                                                        </td>
                                                        <td className="text-center">
                                                            <span className="date-text">{request.createdDate}</span>
                                                        </td>
                                                        <td className="text-center">
                                                            <Badge bg={config.color} className="status-badge">
                                                                {config.text}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <span className="assigned-person">{request.customerName}</span>
                                                        </td>
                                                        <td className="text-center">
                                                            <Button variant="primary" size="sm" onClick={() => handleViewDetails(request)} className="view-button">
                                                                <FaEye className="me-1" /> Xem
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </div>
                    </Container>
                </div>
            </div>
        </div>
    );
};

export default PlanningQuoteRequests;
