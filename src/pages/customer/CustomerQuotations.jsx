import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Card, Table, Button, Spinner, Alert, Badge, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { FaSearch, FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { quotationService } from '../../api/quotationService';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../components/Pagination';
import { getCustomerQuoteStatus } from '../../utils/statusMapper';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale/vi';
import 'react-datepicker/dist/react-datepicker.css';
import { parseDateString, formatDateForBackend } from '../../utils/validators';

registerLocale('vi', vi);

// Helper function to extract date from quotationNumber (format: QUO-YYYYMMDD-XXX)
const getDateFromQuotationNumber = (quotationNumber) => {
    if (!quotationNumber) return null;
    const match = quotationNumber.match(/QUO-(\d{4})(\d{2})(\d{2})-/);
    if (match) {
        const [, year, month, day] = match;
        return `${year}-${month}-${day}`;
    }
    return null;
};

// Helper function to format date for display
const formatQuoteDate = (quote) => {
    const dateFromNumber = getDateFromQuotationNumber(quote.quotationNumber);
    if (dateFromNumber) {
        const [year, month, day] = dateFromNumber.split('-');
        return `${day}/${month}/${year}`;
    }
    if (quote.createdAt) {
        return new Date(quote.createdAt).toLocaleDateString('vi-VN');
    }
    return 'N/A';
};

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

    // Sort state
    const [sortColumn, setSortColumn] = useState('');
    const [sortDirection, setSortDirection] = useState('asc');

    // Handle sort click
    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    // Get sort icon for column
    const getSortIcon = (column) => {
        if (sortColumn !== column) {
            return <FaSort className="ms-1 text-muted" style={{ opacity: 0.5 }} />;
        }
        return sortDirection === 'asc'
            ? <FaSortUp className="ms-1 text-primary" />
            : <FaSortDown className="ms-1 text-primary" />;
    };

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
            // Show generic message for users, log details
            const errorMessage = 'Có lỗi xảy ra khi tải danh sách báo giá. Vui lòng thử lại sau.';
            setError(errorMessage);
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

    // Sort quotations based on sortColumn and sortDirection
    const sortedQuotations = useMemo(() => {
        if (!sortColumn) return quotations;

        return [...quotations].sort((a, b) => {
            let aValue, bValue;

            switch (sortColumn) {
                case 'quotationNumber':
                    aValue = a.quotationNumber || '';
                    bValue = b.quotationNumber || '';
                    break;
                case 'createdDate':
                    aValue = getDateFromQuotationNumber(a.quotationNumber) || '';
                    bValue = getDateFromQuotationNumber(b.quotationNumber) || '';
                    break;
                default:
                    return 0;
            }

            const comparison = aValue.localeCompare(bValue, 'vi');
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [quotations, sortColumn, sortDirection]);

    const handleViewDetails = (id) => {
        navigate(`/customer/quotations/${id}`);
    };

    const handleViewOrder = async (quotation) => {
        try {
            // Fetch contract by quotation ID to get the contract ID
            const { contractService } = await import('../../api/contractService');
            const contract = await contractService.getContractByQuotationId(quotation.id);
            const contractId = contract?.contractId || contract?.id;
            if (contractId) {
                navigate(`/customer/orders/${contractId}`);
            } else {
                toast.error('Không tìm thấy đơn hàng cho báo giá này.');
            }
        } catch (err) {
            console.error('Error fetching contract:', err);
            toast.error('Không thể tải thông tin đơn hàng.');
        }
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
                                            <div className="custom-datepicker-wrapper">
                                                <DatePicker
                                                    selected={parseDateString(createdDateFilter)}
                                                    onChange={(date) => {
                                                        if (date) {
                                                            setCreatedDateFilter(formatDateForBackend(date));
                                                        } else {
                                                            setCreatedDateFilter('');
                                                        }
                                                        setCurrentPage(1);
                                                    }}
                                                    onChangeRaw={(e) => {
                                                        if (e.target.value === '' || e.target.value === null) {
                                                            setCreatedDateFilter('');
                                                            setCurrentPage(1);
                                                        }
                                                    }}
                                                    dateFormat="dd/MM/yyyy"
                                                    locale="vi"
                                                    className="form-control"
                                                    placeholderText="dd/mm/yyyy"
                                                    isClearable
                                                    todayButton="Hôm nay"
                                                />
                                            </div>
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
                                                    <th
                                                        style={{ cursor: 'pointer', userSelect: 'none' }}
                                                        onClick={() => handleSort('quotationNumber')}
                                                    >
                                                        Mã Báo Giá {getSortIcon('quotationNumber')}
                                                    </th>
                                                    <th
                                                        style={{ cursor: 'pointer', userSelect: 'none' }}
                                                        onClick={() => handleSort('createdDate')}
                                                    >
                                                        Ngày Tạo {getSortIcon('createdDate')}
                                                    </th>
                                                    <th>Trạng Thái</th>
                                                    <th>Hành Động</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sortedQuotations.length > 0 ? sortedQuotations.map(quote => {
                                                    const statusObj = getCustomerQuoteStatus(quote.status);
                                                    return (
                                                        <tr key={quote.id}>
                                                            <td>{quote.quotationNumber}</td>
                                                            <td>{formatQuoteDate(quote)}</td>
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
