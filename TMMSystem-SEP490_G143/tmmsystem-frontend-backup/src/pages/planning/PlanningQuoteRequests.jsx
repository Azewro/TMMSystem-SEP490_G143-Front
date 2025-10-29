import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Button, Badge, Form, Pagination } from 'react-bootstrap';
import { FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import PlanningSidebar from '../../components/common/PlanningSidebar';
import { quoteService } from '../../api/quoteService';
import '../../styles/PlanningQuoteRequests.css';

const PlanningQuoteRequests = () => {
    const navigate = useNavigate();
    const [rfqRequests, setRfqRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [customerMap, setCustomerMap] = useState({});

    useEffect(() => {
        const fetchPlanningRFQs = async () => {
            setLoading(true);
            try {
                console.log('=== FETCHING PLANNING RFQs ===');

                // Get all RFQs
                const allRFQs = await quoteService.getAllQuoteRequests();
                console.log('All RFQs for planning:', allRFQs);

                // Filter only SENT RFQs for Planning Department
                const sentRFQs = allRFQs.filter(rfq => rfq.status === 'SENT');
                console.log('SENT RFQs for planning:', sentRFQs);

                // Get all customers for mapping
                const customers = await quoteService.getAllCustomers();
                const custMap = {};
                customers.forEach(customer => {
                    custMap[customer.id] = customer;
                });
                setCustomerMap(custMap);

                // Transform RFQs for display
                const transformedRFQs = sentRFQs.map((rfq, index) => {
                    const customer = custMap[rfq.customerId];
                    return {
                        id: rfq.id || index + 1,
                        rfqCode: rfq.rfqNumber || `RFQ-${rfq.id}`,
                        productCount: rfq.details?.length || 0,
                        createdDate: rfq.createdAt ? new Date(rfq.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
                        status: rfq.status,
                        statusDisplay: getStatusDisplay(rfq.status),
                        statusColor: getStatusColor(rfq.status),
                        assignedTo: customer?.contactPerson || `Customer ${rfq.customerId}`,
                        customerId: rfq.customerId,
                        originalRFQ: rfq
                    };
                });

                // Sort by newest first
                const sortedRFQs = transformedRFQs.reverse();

                console.log('Transformed RFQs for planning:', sortedRFQs);
                setRfqRequests(sortedRFQs);
                setFilteredRequests(sortedRFQs);

            } catch (error) {
                console.error('Error fetching planning RFQs:', error);
                setError('Không thể tải danh sách yêu cầu báo giá. Vui lòng thử lại.');
            } finally {
                setLoading(false);
            }
        };

        fetchPlanningRFQs();
    }, []);

    const getStatusDisplay = (status) => {
        switch (status) {
            case 'SENT': return 'Đang chờ phê duyệt';
            case 'QUOTED': return 'Đã được duyệt';
            case 'APPROVED': return 'Đã duyệt báo giá';
            case 'REJECTED': return 'Đã từ chối';
            default: return 'Đang chờ phê duyệt';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'SENT': return 'warning';
            case 'QUOTED': return 'success';
            case 'APPROVED': return 'primary';
            case 'REJECTED': return 'danger';
            default: return 'secondary';
        }
    };

    const handleStatusFilterChange = (selectedStatus) => {
        setStatusFilter(selectedStatus);
        if (selectedStatus === '') {
            setFilteredRequests(rfqRequests);
        } else {
            const filtered = rfqRequests.filter(request => request.status === selectedStatus);
            setFilteredRequests(filtered);
        }
    };

    const handleViewDetails = (request) => {
        navigate(`/planning/rfq-detail/${request.id}`);
    };

    if (loading) {
        return (
            <div className="planning-layout">
                <Header />
                <div className="d-flex">
                    <PlanningSidebar />
                    <div className="flex-grow-1 d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 70px)' }}>
                        <div>Đang tải dữ liệu...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="planning-layout">
            <Header />

            <div className="d-flex">
                <PlanningSidebar />

                <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
                    <Container fluid className="p-4">
                        <div className="planning-quote-requests-page">
                            {/* Page Header */}
                            <div className="page-header mb-4">
                                <Row className="align-items-center">
                                    <Col>
                                        <h1 className="page-title mb-0">Danh sách yêu cầu báo giá</h1>
                                    </Col>
                                    <Col xs="auto">
                                        <Form.Select
                                            value={statusFilter}
                                            onChange={(e) => handleStatusFilterChange(e.target.value)}
                                            className="status-filter"
                                            style={{ width: '200px' }}
                                        >
                                            <option value="">Tất cả danh mục</option>
                                            <option value="SENT">Đang chờ phê duyệt</option>
                                            <option value="QUOTED">Đã được duyệt</option>
                                            <option value="APPROVED">Đã duyệt báo giá</option>
                                            <option value="REJECTED">Đã từ chối</option>
                                        </Form.Select>
                                    </Col>
                                </Row>
                            </div>

                            {error && (
                                <div className="alert alert-danger">{error}</div>
                            )}

                            {/* RFQ Table */}
                            <div className="table-card bg-white rounded shadow-sm">
                                <Table responsive className="planning-rfq-table mb-0">
                                    <thead className="table-header">
                                        <tr>
                                            <th className="text-center" style={{ width: '80px' }}>#</th>
                                            <th style={{ width: '150px' }}>Mã RFQ</th>
                                            <th className="text-center" style={{ width: '120px' }}>Số lượng sản phẩm</th>
                                            <th className="text-center" style={{ width: '150px' }}>Ngày tạo đơn</th>
                                            <th className="text-center" style={{ width: '180px' }}>Trạng thái</th>
                                            <th style={{ minWidth: '150px' }}>Người phụ trách</th>
                                            <th className="text-center" style={{ width: '100px' }}>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRequests.length > 0 ? (
                                            filteredRequests.map((request, index) => (
                                                <tr key={request.id} className="table-row">
                                                    <td className="text-center fw-bold">{index + 1}</td>
                                                    <td>
                                                        <span className="rfq-code">{request.rfqCode}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="product-count">{request.productCount}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="date-text">{request.createdDate}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <Badge bg={request.statusColor} className="status-badge">
                                                            {request.statusDisplay}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <span className="assigned-person">{request.assignedTo}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={() => handleViewDetails(request)}
                                                            className="view-button"
                                                        >
                                                            <FaEye className="me-1" />
                                                            Xem
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="text-center py-4">
                                                    {statusFilter ? 'Không có yêu cầu nào với trạng thái này' : 'Chưa có yêu cầu báo giá nào được gửi đến'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {filteredRequests.length > 0 && (
                                <div className="d-flex justify-content-center mt-4">
                                    <Pagination>
                                        <Pagination.Prev />
                                        <Pagination.Item active>{1}</Pagination.Item>
                                        <Pagination.Item>{2}</Pagination.Item>
                                        <Pagination.Item>{3}</Pagination.Item>
                                        <Pagination.Item>{4}</Pagination.Item>
                                        <Pagination.Item>{5}</Pagination.Item>
                                        <Pagination.Next />
                                    </Pagination>
                                </div>
                            )}
                        </div>
                    </Container>
                </div>
            </div>
        </div>
    );
};

export default PlanningQuoteRequests;
