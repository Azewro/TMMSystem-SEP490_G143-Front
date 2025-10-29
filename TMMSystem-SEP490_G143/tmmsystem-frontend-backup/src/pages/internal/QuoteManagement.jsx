import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form } from 'react-bootstrap';
import { FaEye } from 'react-icons/fa';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import '../../styles/QuoteRequests.css';
import { quoteService } from '../../api/quoteService';
import { useNavigate } from 'react-router-dom';

const QuoteManagement = () => {
    const navigate = useNavigate();
    const [quotes, setQuotes] = useState([]);
    const [filteredQuotes, setFilteredQuotes] = useState([]);
    const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái');
    const [loading, setLoading] = useState(true);

    // Mock data for quotes (fallback)
    const mockQuotes = [
        {
            id: 1,
            quoteCode: 'QUOTE-2025-001',
            customerName: 'Nguyễn Văn Hùng',
            company: 'Công ty TNHH ABC',
            createdDate: '29/10/2025',
            totalAmount: 281750,
            status: 'Chờ duyệt',
            statusColor: 'warning'
        },
        {
            id: 2,
            quoteCode: 'QUOTE-2025-002',
            customerName: 'Trần Thị Bình',
            company: 'Công ty Cổ phần XYZ',
            createdDate: '28/10/2025',
            totalAmount: 456000,
            status: 'Đã gửi khách hàng',
            statusColor: 'info'
        },
        {
            id: 3,
            quoteCode: 'QUOTE-2025-003',
            customerName: 'Lê Minh Châu',
            company: 'Tập đoàn DEF',
            createdDate: '27/10/2025',
            totalAmount: 325000,
            status: 'Khách hàng đã duyệt',
            statusColor: 'success'
        }
    ];

    useEffect(() => {
        const fetchQuotes = async () => {
            setLoading(true);

            try {
                console.log('=== SALES STAFF: ATTEMPTING TO FETCH QUOTES FROM PLANNING ===');

                // First, let's check if we can get real quotes
                try {
                    const realQuotes = await quoteService.getAllQuotes();
                    console.log('✅ Real quotes API works! Data:', realQuotes);

                    if (realQuotes && realQuotes.length > 0) {
                        console.log('📊 Found real quotes:', realQuotes.length);
                        // Process real data...
                        const processedQuotes = realQuotes.map((quote, index) => ({
                            id: quote.id || index + 1,
                            quoteCode: `QUOTE-${quote.id || (index + 1)}`,
                            customerName: `Customer ${quote.rfqId}`,  // Simplified for now
                            company: `Company ${quote.rfqId}`,
                            createdDate: quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
                            totalAmount: quote.totalAmount || 0,
                            status: quote.status === 'PENDING' ? 'Chờ duyệt' : 'Chờ duyệt',
                            statusColor: 'warning'
                        }));

                        console.log('✅ Using REAL quote data:', processedQuotes);
                        setQuotes(processedQuotes);
                        setFilteredQuotes(processedQuotes);
                        return;
                    }
                } catch (quotesError) {
                    console.log('❌ Real quotes API failed:', quotesError.message);

                    // If quotes API doesn't exist, let's see if there are any RFQs with QUOTED status
                    try {
                        console.log('🔍 Checking for QUOTED RFQs instead...');
                        const rfqs = await quoteService.getAllQuoteRequests();
                        console.log('All RFQs:', rfqs);

                        const quotedRFQs = rfqs.filter(rfq => rfq.status === 'QUOTED');
                        console.log('RFQs with QUOTED status:', quotedRFQs);

                        if (quotedRFQs.length > 0) {
                            // Transform quoted RFQs into quote format
                            const quotesFromRFQs = quotedRFQs.map((rfq, index) => ({
                                id: rfq.id,
                                quoteCode: `QUOTE-${rfq.id}`,
                                customerName: `Customer ${rfq.customerId}`,
                                company: `Company ${rfq.customerId}`,
                                createdDate: rfq.updatedAt ? new Date(rfq.updatedAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
                                totalAmount: 281750, // Mock amount for now
                                status: 'Chờ duyệt',
                                statusColor: 'warning'
                            }));

                            console.log('✅ Using quotes from QUOTED RFQs:', quotesFromRFQs);
                            setQuotes(quotesFromRFQs);
                            setFilteredQuotes(quotesFromRFQs);
                            return;
                        }
                    } catch (rfqError) {
                        console.log('❌ Could not fetch RFQs either:', rfqError.message);
                    }
                }

                // Fallback to mock data
                console.log('📝 Using mock data as fallback');
                setQuotes(mockQuotes);
                setFilteredQuotes(mockQuotes);

            } catch (error) {
                console.error('❌ Unexpected error:', error);
                setQuotes(mockQuotes);
                setFilteredQuotes(mockQuotes);
            } finally {
                setLoading(false);
            }
        };

        fetchQuotes();
    }, []);

    const handleStatusFilter = (status) => {
        setStatusFilter(status);
        if (status === 'Tất cả trạng thái') {
            setFilteredQuotes(quotes);
        } else {
            setFilteredQuotes(quotes.filter(quote => quote.status === status));
        }
    };

    const handleViewDetails = (quote) => {
        navigate(`/internal/quote-detail/${quote.id}`);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount || 0) + ' ₫';
    };

    return (
        <div className="internal-layout">
            <Header />

            <div className="d-flex">
                <InternalSidebar />

                <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
                    <Container fluid className="p-4">
                        <div className="quote-requests-dashboard">
                            <div className="dashboard-header mb-4">
                                <h1 className="dashboard-title">Danh sách Báo giá</h1>
                            </div>

                            <Row className="mb-4">
                                <Col md={3}>
                                    <Form.Select
                                        value={statusFilter}
                                        onChange={(e) => handleStatusFilter(e.target.value)}
                                        className="status-filter"
                                    >
                                        <option>Tất cả trạng thái</option>
                                        <option>Chờ duyệt</option>
                                        <option>Đã gửi khách hàng</option>
                                        <option>Khách hàng đã duyệt</option>
                                        <option>Khách hàng từ chối</option>
                                    </Form.Select>
                                </Col>
                            </Row>

                            <Card className="quote-table-card shadow-sm">
                                <Card.Body className="p-0">
                                    <Table responsive hover className="quote-requests-table mb-0">
                                        <thead className="table-header">
                                            <tr>
                                                <th style={{ width: '50px' }}>#</th>
                                                <th style={{ width: '150px' }}>Mã báo giá</th>
                                                <th style={{ width: '200px' }}>Người đại diện</th>
                                                <th style={{ width: '200px' }}>Công ty</th>
                                                <th style={{ width: '120px' }}>Ngày tạo</th>
                                                <th style={{ width: '150px' }}>Tổng giá trị</th>
                                                <th style={{ width: '120px' }}>Trạng thái</th>
                                                <th style={{ width: '100px' }}>Hành động</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr>
                                                    <td colSpan="8" className="text-center py-4">
                                                        Đang tải dữ liệu báo giá...
                                                    </td>
                                                </tr>
                                            ) : filteredQuotes.length === 0 ? (
                                                <tr>
                                                    <td colSpan="8" className="text-center py-4">
                                                        Không có báo giá nào
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredQuotes.map((quote, index) => (
                                                    <tr key={quote.id}>
                                                        <td>{index + 1}</td>
                                                        <td>
                                                            <span className="rfq-code">{quote.quoteCode}</span>
                                                        </td>
                                                        <td>{quote.customerName}</td>
                                                        <td>{quote.company}</td>
                                                        <td>{quote.createdDate}</td>
                                                        <td className="text-end fw-bold text-success">
                                                            {formatCurrency(quote.totalAmount)}
                                                        </td>
                                                        <td>
                                                            <Badge bg={quote.statusColor} className="status-badge">
                                                                {quote.status}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <Button
                                                                variant="outline-secondary"
                                                                size="sm"
                                                                onClick={() => handleViewDetails(quote)}
                                                                className="detail-button"
                                                                title="Chi tiết"
                                                            >
                                                                <FaEye />
                                                                <span className="ms-1">Chi tiết</span>
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>

                            <div className="pagination-info mt-3">
                                <small className="text-muted">
                                    Hiển thị {filteredQuotes.length} / {quotes.length} báo giá
                                </small>
                            </div>
                        </div>
                    </Container>
                </div>
            </div>
        </div>
    );
};

export default QuoteManagement;
