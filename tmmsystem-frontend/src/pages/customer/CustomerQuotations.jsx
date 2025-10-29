import React, { useEffect, useMemo, useState } from 'react';
import { Container, Card, Table, Badge, Button, Form, InputGroup } from 'react-bootstrap';
import { FaSearch, FaEye } from 'react-icons/fa';
import Header from '../../components/common/Header';
import CustomerSidebar from '../../components/common/CustomerSidebar';
import { quoteService } from '../../api/quoteService';
import { useAuth } from '../../context/AuthContext';

const statusMap = {
  SENT: { label: 'Đã báo giá', variant: 'success' },
  PENDING: { label: 'Chờ phê duyệt', variant: 'warning' },
  ACCEPTED: { label: 'Đã duyệt', variant: 'primary' },
  REJECTED: { label: 'Từ chối', variant: 'danger' },
};

const formatDate = (iso) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('vi-VN'); } catch { return iso; }
};

const CustomerQuotations = () => {
  const { user } = useAuth();
  const customerId = user?.customerId || user?.id;

  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    const fetch = async () => {
      if (!customerId) { setError('Thiếu thông tin khách hàng'); setLoading(false); return; }
      setLoading(true); setError('');
      try {
        const data = await quoteService.getCustomerQuotations(customerId);
        setQuotes(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message || 'Không thể tải báo giá của bạn');
      } finally { setLoading(false); }
    };
    fetch();
  }, [customerId]);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return quotes;
    return quotes.filter(x => {
      const num = x.quotationNumber || '';
      const date = formatDate(x.createdAt) || '';
      return [num, date].some(v => String(v).toLowerCase().includes(keyword));
    });
  }, [q, quotes]);

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <CustomerSidebar />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <div className="mb-3 d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Danh sách yêu cầu báo giá</h4>
              <Button variant="outline-primary" size="sm" onClick={()=>window.location.href='/customer/quote-request'}>
                Tạo yêu cầu báo giá
              </Button>
            </div>

            <div className="mb-3">
              <InputGroup style={{ maxWidth: 420 }}>
                <InputGroup.Text><FaSearch /></InputGroup.Text>
                <Form.Control placeholder="Tìm kiếm sản phẩm..." value={q} onChange={(e)=>setQ(e.target.value)} />
              </InputGroup>
            </div>

            <Card className="shadow-sm">
              <Card.Body className="p-0">
                <Table responsive className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 60 }}>#</th>
                      <th>Mã RFQ</th>
                      <th>Số lượng sản phẩm</th>
                      <th>Ngày tạo đơn</th>
                      <th>Trạng thái đơn hàng</th>
                      <th style={{ width: 140 }} className="text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (<tr><td colSpan={6} className="text-center py-4">Đang tải...</td></tr>)}
                    {!loading && error && (<tr><td colSpan={6} className="text-danger text-center py-4">{error}</td></tr>)}
                    {!loading && !error && filtered.length === 0 && (<tr><td colSpan={6} className="text-center py-4">Chưa có báo giá nào</td></tr>)}
                    {!loading && !error && filtered.map((x, idx) => {
                      const badge = statusMap[x.status] || statusMap.SENT;
                      const rfqCode = x.rfqNumber || x.rfq?.rfqNumber || (x.rfqId ? `RFQ-${x.rfqId}` : x.quotationNumber || x.id);
                      const itemsCount = Array.isArray(x.items) ? x.items.length : (x.itemCount || x.itemsCount || 1);
                      return (
                        <tr key={x.id || idx}>
                          <td>{idx + 1}</td>
                          <td>
                            <div className="fw-semibold">Mã RFQ</div>
                            <div className="text-muted small">{rfqCode}</div>
                          </td>
                          <td>{itemsCount}</td>
                          <td>{formatDate(x.createdAt)}</td>
                          <td>
                            <div className="text-muted small">Trạng thái đơn hàng</div>
                            <div><Badge bg={badge.variant}>{badge.label}</Badge></div>
                          </td>
                          <td className="text-center">
                            <Button size="sm" variant="primary" onClick={() => window.location.href = `/customer/quotations/${x.id}` }>
                              <FaEye className="me-1" /> Xem đơn
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

export default CustomerQuotations;
