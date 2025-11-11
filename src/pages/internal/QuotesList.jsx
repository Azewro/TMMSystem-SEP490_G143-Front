import React, { useEffect, useMemo, useState } from 'react';
import { Container, Card, Table, Badge, Button, Alert, Spinner } from 'react-bootstrap'; // Removed Form, InputGroup
import { FaEye } from 'react-icons/fa'; // Removed FaSearch, FaSignInAlt
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { quoteService } from '../../api/quoteService';
import '../../styles/QuoteRequests.css'; // Added CSS import

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

  const handleViewDetail = (quote) => {
    navigate(`/sales/quotations/${quote.id}`);
  };

  return (
    <div>
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="sales" />
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid>
            <h2 className="mb-4">Danh sách Báo giá</h2>

            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
              </Alert>
            )}

            <Card className="shadow-sm">
              <Card.Header>
                Các báo giá đã được tạo
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0 align-middle">
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
                        <Spinner animation="border" size="sm" className="me-2" />
                        Đang tải...
                      </td></tr>
                    )}
                    {!loading && error && (
                      <tr><td colSpan={8} className="text-center py-4 text-muted">
                        Không thể hiển thị dữ liệu do lỗi
                      </td></tr>
                    )}
                    {!loading && !error && quotes.length === 0 && (
                      <tr><td colSpan={8} className="text-center py-4 text-muted">
                        Chưa có báo giá nào
                      </td></tr>
                    )}
                    {!loading && !error && quotes.map((quote, idx) => {
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
                              variant="primary"
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
