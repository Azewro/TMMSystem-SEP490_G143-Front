import React, { useEffect, useMemo, useState } from 'react';
import { Container, Card, Table, Badge, Button } from 'react-bootstrap';
import { FaEye } from 'react-icons/fa';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
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

const formatCurrency = (value) => {
  if (!value) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
};

const CustomerQuotations = () => {
  const { user } = useAuth();
  const customerId = user?.customerId || user?.id;

  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      if (!customerId) { setError('Thiếu thông tin khách hàng'); setLoading(false); return; }
      setLoading(true); setError('');
      try {
        const data = await quoteService.getCustomerQuotations(customerId);
        const sortedData = (Array.isArray(data) ? data : []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setQuotes(sortedData);
      } catch (e) {
        setError(e.message || 'Không thể tải báo giá của bạn');
      } finally { setLoading(false); }
    };
    fetch();
  }, [customerId]);

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <Sidebar />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <div className="mb-3 d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Danh sách báo giá</h4>
              <Button variant="outline-primary" size="sm" onClick={()=>window.location.href='/customer/quote-request'}>
                Tạo yêu cầu báo giá
              </Button>
            </div>

            <Card className="shadow-sm">
              <Card.Body className="p-0">
                <Table responsive className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Mã Báo Giá</th>
                      <th>Ngày Giao Hàng Dự Kiến</th>
                      <th>Trạng Thái</th>
                      <th>Tổng Tiền</th>
                      <th className="text-center">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (<tr><td colSpan={5} className="text-center py-4">Đang tải...</td></tr>)}
                    {!loading && error && (<tr><td colSpan={5} className="text-danger text-center py-4">{error}</td></tr>)}
                    {!loading && !error && quotes.length === 0 && (<tr><td colSpan={5} className="text-center py-4">Chưa có báo giá nào</td></tr>)}
                    {!loading && !error && quotes.map((x) => {
                      const badge = statusMap[x.status] || statusMap.SENT;
                      const rfqCode = x.rfqNumber || x.rfq?.rfqNumber || (x.rfqId ? `RFQ-${x.rfqId}` : x.quotationNumber || x.id);
                      return (
                        <tr key={x.id}>
                          <td>
                            <div className="fw-semibold">{rfqCode}</div>
                          </td>
                          <td>{formatDate(x.validUntil)}</td>
                          <td>
                            <Badge bg={badge.variant}>{badge.label}</Badge>
                          </td>
                          <td>{formatCurrency(x.totalAmount)}</td>
                          <td className="text-center">
                            <Button size="sm" variant="primary" onClick={() => window.location.href = `/customer/quotations/${x.id}` }>
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

export default CustomerQuotations;
