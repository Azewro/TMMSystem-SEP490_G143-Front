import React, { useEffect, useMemo, useState } from 'react';
import { Container, Card, Table, Badge, Button, Form, InputGroup, Alert } from 'react-bootstrap';
import { FaSearch, FaEye, FaSignInAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { quoteService } from '../../api/quoteService';

const statusMap = {
  DRAFT: { variant: 'secondary' },
  SENT: { variant: 'primary' },
  ACCEPTED: { variant: 'success' },
  REJECTED: { variant: 'danger' },
  EXPIRED: { variant: 'light', text: 'dark' },
  CANCELED: { variant: 'dark' },
  ORDER_CREATED: { variant: 'info' },
  QUOTED: { variant: 'info' }
};

const formatDate = (iso) => {
  if (!iso) return '';
  try { 
    return new Date(iso).toLocaleDateString('vi-VN'); 
  } catch { 
    return iso; 
  }
};

const formatCurrency = (amount) => {
  if (!amount) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const QuotesList = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    const fetchAndEnrichQuotes = async () => {
      setLoading(true);
      setError('');
      try {
        const [quotesData, customersData] = await Promise.all([
          quoteService.getAllQuotes(),
          quoteService.getAllCustomers()
        ]);

        if (Array.isArray(quotesData) && Array.isArray(customersData)) {
          const customerMap = new Map(customersData.map(c => [c.id, c]));
          const enrichedQuotes = quotesData.map(quote => ({
            ...quote,
            customer: customerMap.get(quote.customerId)
          }));

          const sortedData = enrichedQuotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setQuotes(sortedData);
        } else {
          console.warn('API returned non-array data for quotes or customers.');
          setQuotes([]);
        }
      } catch (e) {
        console.error('Fetch error:', e);
        setError('Không thể tải danh sách báo giá: ' + (e?.message || 'Lỗi không xác định'));
        setQuotes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAndEnrichQuotes();
  }, []);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return quotes;
    return quotes.filter(x => {
      const num = (x.quotationNumber || x.id || '').toString().toLowerCase();
      const rep = (x.customer?.contactPerson || x.customer?.companyName || '').toLowerCase();
      return num.includes(keyword) || rep.includes(keyword);
    });
  }, [q, quotes]);

  const handleViewDetail = (quote) => {
    console.log('Navigating to quote:', quote.id);
    // Use navigate instead of window.location to prevent auth issues
    navigate(`/internal/quotations/${quote.id}`);
  };

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <div className="mb-3">
              <InputGroup style={{ maxWidth: 420 }}>
                <InputGroup.Text><FaSearch /></InputGroup.Text>
                <Form.Control 
                  placeholder="Tìm kiếm báo giá..." 
                  value={q} 
                  onChange={(e)=>setQ(e.target.value)} 
                />
              </InputGroup>
            </div>

            <h4 className="mb-3">Danh sách Báo giá</h4>

            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
              </Alert>
            )}

            <Card className="shadow-sm">
              <Card.Body className="p-0">
                <Table responsive className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 60 }}>#</th>
                      <th>Mã báo giá</th>
                      <th>Người đại diện</th>
                      <th>Công ty</th>
                      <th>Ngày tạo</th>
                      <th>Tổng giá trị</th>
                      <th>Trạng thái</th>
                      <th style={{ width: 140 }} className="text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr><td colSpan={8} className="text-center py-4">
                        <div className="spinner-border spinner-border-sm me-2"></div>
                        Đang tải...
                      </td></tr>
                    )}
                    {!loading && error && (
                      <tr><td colSpan={8} className="text-center py-4 text-muted">
                        Không thể hiển thị dữ liệu do lỗi
                      </td></tr>
                    )}
                    {!loading && !error && filtered.length === 0 && (
                      <tr><td colSpan={8} className="text-center py-4 text-muted">
                        {quotes.length === 0 ? 'Chưa có báo giá nào' : 'Không tìm thấy báo giá'}
                      </td></tr>
                    )}
                    {!loading && !error && filtered.map((quote, idx) => {
                      const status = statusMap[quote.status] || { variant: 'secondary' };
                      return (
                        <tr key={quote.id || idx}>
                          <td>{idx + 1}</td>
                          <td className="fw-semibold text-primary">
                            {quote.quotationNumber || `QUOTE-${quote.id}`}
                          </td>
                          <td>{quote.customer?.contactPerson || '—'}</td>
                          <td>{quote.customer?.companyName || '—'}</td>
                          <td>{formatDate(quote.createdAt)}</td>
                          <td className="text-success fw-semibold">
                            {formatCurrency(quote.totalAmount)}
                          </td>
                          <td>
                            <Badge bg={status.variant} text={status.text || null} className="px-2 py-1">
                              {quote.status}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <Button 
                              size="sm" 
                              variant="light"
                              onClick={() => handleViewDetail(quote)}
                            >
                              <FaEye className="me-1" /> Chi tiết
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
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

export default QuotesList;
