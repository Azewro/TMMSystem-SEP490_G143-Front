import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Spinner, Alert, Badge, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { quotationService } from '../../api/quotationService';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../components/Pagination';
import { getCustomerQuoteStatus } from '../../utils/statusMapper';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const CustomerQuotations = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Search and filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [createdDateFilter, setCreatedDateFilter] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const ITEMS_PER_PAGE = 10;

    const fetchQuotations = useCallback(async () => {
        if (!user || !user.customerId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');
        try {
            // Prepare search parameter
            const trimmedSearch = debouncedSearchTerm?.trim() || '';
            const searchParam = trimmedSearch.length > 0 ? trimmedSearch : undefined;

            // Fetch all quotations for client-side filtering
            // Note: Similar to MyRfqs, we fetch all and filter client-side for complex status mapping
            const response = await quotationService.getCustomerQuotations(
                user.customerId,
                0, // Fetch all
                1000,
                searchParam,
                undefined,
                undefined,
                undefined,
                createdDateFilter || undefined
            );

            let allQuotes = [];
            if (response && response.content) {
                allQuotes = response.content;
            } else if (Array.isArray(response)) {
                allQuotes = response;
            }

            // Filter by Status (client-side based on getCustomerQuoteStatus)
            let filteredQuotes = allQuotes;
            if (statusFilter) {
                filteredQuotes = filteredQuotes.filter(q => {
                    const statusObj = getCustomerQuoteStatus(q.status);
                    return statusObj.value === statusFilter;
                });
            }

            // Calculate pagination for filtered results
            const totalFiltered = filteredQuotes.length;
            const newTotalPages = Math.max(1, Math.ceil(totalFiltered / ITEMS_PER_PAGE));
            setTotalPages(newTotalPages);
            setTotalElements(totalFiltered);

            // Apply pagination to filtered results
            const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
            const endIndex = startIndex + ITEMS_PER_PAGE;
            const paginatedQuotes = filteredQuotes.slice(startIndex, endIndex);

            setQuotations(paginatedQuotes);

        } catch (err) {
            console.error('Error fetching quotations:', err);
            const errorMessage = err.message || 'Lỗi khi tải danh sách báo giá.';
            setError(errorMessage);
            toast.error(errorMessage);
            setQuotations([]);
            setTotalPages(1);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearchTerm, statusFilter, createdDateFilter, user]);

    // Debounce search term
    useEffect(() => {
        if (!searchTerm || searchTerm.trim() === '') {
            setDebouncedSearchTerm('');
            return;
        }

        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchQuotations();
    }, [fetchQuotations]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm, statusFilter, createdDateFilter]);

    const handleViewDetails = (id) => {
        navigate(`/customer/quotations/${id}`);
    };

    const handleViewOrder = (quotation) => {
        // Navigate to order list or detail if orderId exists
        navigate(`/customer/orders`);
    };

    return (
        <div>
            <Header />
            <div className="d-flex">
                <Sidebar />
                <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
                    <Container fluid>
                        <h2 className="mb-4">Danh sách Báo giá</h2>
                        {/* Search and Filter Section */}
                        <Card className="mb-3">
                            <Card.Body>
                                <Row className="g-3 align-items-end">
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label className="mb-1 small">Tìm kiếm</Form.Label>
                                            <InputGroup>
                                                <InputGroup.Text><FaSearch /></InputGroup.Text>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Tìm theo mã báo giá..."
                                                    value={searchTerm}
                                                    onChange={(e) => {
                                                        setSearchTerm(e.target.value);
                                                        setCurrentPage(1);
                                                    }}
                                                />
                                            </InputGroup>
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label className="mb-1 small">Lọc theo ngày tạo</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={createdDateFilter}
                                                onChange={(e) => {
                                                    setCreatedDateFilter(e.target.value);
                                                    setCurrentPage(1);
                                                }}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label className="mb-1 small">Lọc theo trạng thái</Form.Label>
                                            <Form.Select
                                                value={statusFilter}
                                                onChange={(e) => {
                                                    setStatusFilter(e.target.value);
                                                    setCurrentPage(1);
                                                }}
                                            >
                                                <option value="">Tất cả trạng thái</option>
                                                <option value="DRAFT">Chờ báo giá</option>
                                                <option value="SENT">Chờ phê duyệt</option>
                                                <option value="ACCEPTED">Đã phê duyệt</option>
                                                <option value="REJECTED">Đã từ chối</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        <Card>
                            <Card.Header>
                                Danh sách các báo giá
                            </Card.Header>
                            <Card.Body>
                                {loading ? (
                                    <div className="text-center"><Spinner animation="border" /></div>
                                ) : error ? (
                                    <Alert variant="danger">{error}</Alert>
                                ) : (
                                    <>
                                        <Table striped bordered hover responsive>
                                            <thead>
                                                <tr>
                                                    <th>Mã Báo Giá</th>
                                                    <th>Ngày Tạo</th>
                                                    <th>Trạng Thái</th>
                                                    <th>Hành Động</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {quotations.length > 0 ? quotations.map(quote => {
                                                    const statusObj = getCustomerQuoteStatus(quote.status);
                                                    return (
                                                        <tr key={quote.id}>
                                                            <td>{quote.quotationNumber}</td>
                                                            <td>{new Date(quote.createdAt).toLocaleDateString('vi-VN')}</td>
                                                            <td>
                                                                <Badge bg={statusObj.variant}>{statusObj.label}</Badge>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex gap-2">
                                                                    {statusObj.value === 'DRAFT' && (
                                                                        <span className="text-muted small">Chờ Sales gửi</span>
                                                                    )}

                                                                    {(statusObj.value === 'SENT' || statusObj.value === 'REJECTED') && (
                                                                        <Button variant="primary" size="sm" onClick={() => handleViewDetails(quote.id)}>
                                                                            Xem chi tiết
                                                                        </Button>
                                                                    )}

                                                                    {statusObj.value === 'ACCEPTED' && (
                                                                        <>
                                                                            <Button variant="primary" size="sm" onClick={() => handleViewDetails(quote.id)}>
                                                                                Xem chi tiết
                                                                            </Button>
                                                                            <Button variant="success" size="sm" onClick={() => handleViewOrder(quote)}>
                                                                                Xem đơn hàng
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                }) : (
                                                    <tr>
                                                        <td colSpan="4" className="text-center">
                                                            {totalElements === 0
                                                                ? 'Bạn chưa có báo giá nào.'
                                                                : 'Không tìm thấy báo giá phù hợp với bộ lọc.'}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            onPageChange={setCurrentPage}
                                        />
                                    </>
                                )}
                            </Card.Body>
                        </Card>
                    </Container>
                </div>
            </div>
        </div>
    );
};

export default CustomerQuotations;
