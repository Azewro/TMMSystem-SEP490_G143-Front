import React, { useEffect, useMemo, useState } from 'react';
import { Container, Card, Table, Badge, Button, Form, InputGroup, Alert } from 'react-bootstrap';
import { FaSearch, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';


import { quoteService } from '../../api/quoteService'; // To get customer data

const formatDate = (iso) => {
  if (!iso) return '';
  try { 
    return new Date(iso).toLocaleDateString('vi-VN'); 
  } catch { 
    return iso; 
  }
};

const OrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    const fetchAndEnrichOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const [quotesData, customersData] = await Promise.all([
          quoteService.getAllQuotes(),
          quoteService.getAllCustomers()
        ]);

        if (Array.isArray(quotesData) && Array.isArray(customersData)) {
          const customerMap = new Map(customersData.map(c => [c.id, c]));

          const orderLikeQuotes = quotesData
            .filter(q => q.status === 'ORDER_CREATED')
            .map(order => ({
              ...order,
              customer: customerMap.get(order.customerId),
              displayStatus: 'DRAFT' // Per previous request
            }));

          const sortedData = orderLikeQuotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setOrders(sortedData);
        } else {
          console.warn('API returned non-array data for quotes or customers.');
          setOrders([]);
        }
      } catch (e) {
        console.error('Fetch error:', e);
        setError('Không thể tải danh sách đơn hàng: ' + (e?.message || 'Lỗi không xác định'));
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAndEnrichOrders();
  }, []);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return orders;
    return orders.filter(x => {
      const num = (x.productionOrderCode || x.id || '').toString().toLowerCase();
      const rep = (x.customer?.contactPerson || x.customer?.companyName || '').toLowerCase();
      return num.includes(keyword) || rep.includes(keyword);
    });
  }, [q, orders]);

  const handleViewDetail = (order) => {
    navigate(`/internal/orders/${order.id}`);
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
                  placeholder="Tìm kiếm đơn hàng..." 
                  value={q} 
                  onChange={(e)=>setQ(e.target.value)} 
                />
              </InputGroup>
            </div>

            <h4 className="mb-3">Danh sách Đơn hàng</h4>

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
                      <th style={{ width: 60 }}>STT</th>
                      <th>Mã đơn hàng</th>
                      <th>Người đại diện</th>
                      <th>Ngày tạo đơn</th>
                      <th>Trạng thái</th>
                      <th style={{ width: 140 }} className="text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr><td colSpan={6} className="text-center py-4">
                        <div className="spinner-border spinner-border-sm me-2"></div>
                        Đang tải...
                      </td></tr>
                    )}
                    {!loading && error && (
                      <tr><td colSpan={6} className="text-center py-4 text-muted">
                        Không thể hiển thị dữ liệu do lỗi
                      </td></tr>
                    )}
                    {!loading && !error && filtered.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-4 text-muted">
                        {orders.length === 0 ? 'Chưa có đơn hàng nào' : 'Không tìm thấy đơn hàng'}
                      </td></tr>
                    )}
                    {!loading && !error && filtered.map((order, idx) => (
                      <tr key={order.id || idx}>
                        <td>{idx + 1}</td>
                        <td className="fw-semibold text-primary">
                          {order.quotationNumber || `ORDER-${order.id}`}
                        </td>
                        <td>{order.customer?.contactPerson || '—'}</td>
                        <td>{formatDate(order.createdAt)}</td>
                        <td>
                          <Badge bg="secondary" className="px-2 py-1">
                            {order.displayStatus}
                          </Badge>
                        </td>
                        <td className="text-center">
                          <Button 
                            size="sm" 
                            variant="light"
                            onClick={() => handleViewDetail(order)}
                          >
                            <FaEye className="me-1" /> Chi tiết
                          </Button>
                        </td>
                      </tr>
                    ))}
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

export default OrderList;
