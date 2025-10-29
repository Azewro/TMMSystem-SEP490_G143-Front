import React, { useEffect, useMemo, useState } from 'react';
import { Container, Card, Table, Badge, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { quoteService } from '../../api/quoteService';
import '../../styles/QuoteRequests.css';

const STATUS_LABELS = {
    DRAFT: { text: 'Chờ duyệt', variant: 'warning' },
    SENT: { text: 'Đã gửi khách hàng', variant: 'info' },
    ACCEPTED: { text: 'Khách hàng đã đồng ý', variant: 'success' },
    APPROVED: { text: 'Đã duyệt', variant: 'success' },
    ORDER_CREATED: { text: 'Đã tạo hợp đồng', variant: 'primary' },
    REJECTED: { text: 'Bị từ chối', variant: 'danger' }
};

const statusOptions = [
    { value: 'ALL', label: 'Tất cả trạng thái' },
    { value: 'DRAFT', label: 'Chờ duyệt' },
    { value: 'SENT', label: 'Đã gửi khách hàng' },
    { value: 'ACCEPTED', label: 'Khách hàng đã đồng ý' },
    { value: 'ORDER_CREATED', label: 'Đã tạo hợp đồng' },
    { value: 'REJECTED', label: 'Bị từ chối' }
];

const formatCurrency = (amount) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

const formatDate = (iso) => {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleDateString('vi-VN');
    } catch (error) {
        console.warn('Cannot parse date', iso, error);
        return iso;
    }
};

const QuoteManagement = () => {
    const navigate = useNavigate();
    const [quotes, setQuotes] = useState([]);
    const [filter, setFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadQuotes = async () => {
            setLoading(true);
            setError('');

            try {
                const data = await quoteService.getAllQuotes();
                const sorted = Array.isArray(data)
                    ? data.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                    : [];
                setQuotes(sorted);
            } catch (err) {
                console.error('Unable to fetch quotations', err);
                setError(err.message || 'Không thể tải danh sách báo giá.');
            } finally {
                setLoading(false);
            }
        };

        loadQuotes();
    }, []);

    const filteredQuotes = useMemo(() => {
        if (filter === 'ALL') {
            return quotes;
        }
        return quotes.filter((quote) => quote.status === filter);
    }, [filter, quotes]);

    const handleViewDetail = (quoteId) => {
        navigate(`/internal/quotations/${quoteId}`);
    };

    return (
        <div className="customer-layout">
            <Header />
            <div className="d-flex">
                <InternalSidebar />
                <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
                    <Container fluid className="p-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h1 className="mb-0">Quản lý báo giá</h1>
                            <Form.Select value={filter} onChange={(event) => setFilter(event.target.value)} style={{ width: 260 }}>
                                {statusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </div>

                        {error && (
                            <Alert variant="danger" onClose={() => setError('')} dismissible>
                                {error}
                            </Alert>
                        )}

                        <Card className="shadow-sm">
                            <Card.Body className="p-0">
                                <Table responsive hover className="mb-0 align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: 60 }}>#</th>
                                            <th style={{ width: 180 }}>Mã báo giá</th>
                                            <th>Khách hàng</th>
                                            <th style={{ width: 200 }}>Công ty</th>
                                            <th style={{ width: 140 }}>Ngày tạo</th>
                                            <th style={{ width: 160 }}>Tổng giá trị</th>
                                            <th style={{ width: 160 }}>Trạng thái</th>
                                            <th style={{ width: 140 }} className="text-center">
                                                Hành động
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={8} className="text-center py-4">
                                                    <Spinner animation="border" size="sm" className="me-2" /> Đang tải...
                                                </td>
                                            </tr>
                                        ) : filteredQuotes.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="text-center py-4 text-muted">
                                                    {filter === 'ALL' ? 'Chưa có báo giá nào.' : 'Không có báo giá ở trạng thái này.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredQuotes.map((quote, index) => {
                                                const statusConfig = STATUS_LABELS[quote.status] || STATUS_LABELS.DRAFT;
                                                return (
                                                    <tr key={quote.id}>
                                                        <td>{index + 1}</td>
                                                        <td className="fw-semibold text-primary">{quote.quotationNumber || `QUOTE-${quote.id}`}</td>
                                                        <td>{quote.customer?.contactPerson || '—'}</td>
                                                        <td>{quote.customer?.companyName || '—'}</td>
                                                        <td>{formatDate(quote.createdAt)}</td>
                                                        <td className="text-success fw-semibold">{formatCurrency(quote.totalAmount)}</td>
                                                        <td>
                                                            <Badge bg={statusConfig.variant}>{statusConfig.text}</Badge>
                                                        </td>
                                                        <td className="text-center">
                                                            <Button variant="light" size="sm" onClick={() => handleViewDetail(quote.id)}>
                                                                <FaEye className="me-1" /> Chi tiết
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Container>
                </div>
            </div>
        </div>
    );
};

export default QuoteManagement;
