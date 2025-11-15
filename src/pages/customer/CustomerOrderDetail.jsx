import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Table, Badge, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { contractService } from '../../api/contractService';
import { productService } from '../../api/productService';
import { useAuth } from '../../context/AuthContext';

const statusMap = {
  DRAFT: { label: 'Bản nháp', variant: 'secondary' },
  PENDING_UPLOAD: { label: 'Chờ tải hợp đồng', variant: 'warning' },
  PENDING_APPROVAL: { label: 'Chờ phê duyệt', variant: 'info' },
  APPROVED: { label: 'Đã phê duyệt', variant: 'success' },
  REJECTED: { label: 'Đã từ chối', variant: 'danger' },
  SIGNED: { label: 'Đã ký', variant: 'primary' },
  CANCELED: { label: 'Đã hủy', variant: 'dark' },
  // Legacy statuses for backward compatibility
  PENDING: { label: 'Chờ xử lý', variant: 'warning' },
  UPLOADED_SIGNED: { label: 'Đã tải lên hợp đồng', variant: 'info' },
  DIRECTOR_APPROVED: { label: 'Giám đốc đã duyệt', variant: 'success' },
  DIRECTOR_REJECTED: { label: 'Giám đốc từ chối', variant: 'danger' },
  COMPLETED: { label: 'Hoàn thành', variant: 'primary' },
};

const formatDate = (iso) => {
  if (!iso) return 'N/A';
  try { 
    return new Date(iso).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }); 
  } catch { 
    return iso; 
  }
};

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const CustomerOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [productDetails, setProductDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!user?.customerId) {
        setError('Không tìm thấy thông tin khách hàng.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        // Fetch order (contract) details
        const allContracts = await contractService.getAllContracts();
        const contract = allContracts.find(
          c => c.id === parseInt(id, 10) && c.customerId === parseInt(user.customerId, 10)
        );

        if (!contract) {
          setError('Không tìm thấy đơn hàng này.');
          setLoading(false);
          return;
        }

        setOrder(contract);

        // Fetch order details (items)
        try {
          const details = await contractService.getOrderDetails(contract.id);
          setOrderDetails(Array.isArray(details) ? details : []);

          // Fetch product details for each item
          const productPromises = (Array.isArray(details) ? details : []).map(item => 
            productService.getProductById(item.productId).catch(() => null)
          );
          const products = await Promise.all(productPromises);
          const productsMap = products.reduce((acc, product, index) => {
            if (product && details[index]) {
              acc[details[index].productId] = product;
            }
            return acc;
          }, {});
          setProductDetails(productsMap);
        } catch (detailError) {
          console.error('Error fetching order details:', detailError);
          setOrderDetails([]);
        }
      } catch (e) {
        setError(e.message || 'Không thể tải chi tiết đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrderDetail();
    }
  }, [id, user]);

  const totalWeight = orderDetails.reduce((total, item) => {
    const product = productDetails[item.productId];
    const weight = (product?.standardWeight || 0) / 1000;
    return total + (item.quantity * weight);
  }, 0);

  const badge = order ? (statusMap[order.status] || { label: order.status || 'Không xác định', variant: 'secondary' }) : null;

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <Sidebar />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <Button variant="outline-secondary" className="mb-3" onClick={() => navigate('/customer/orders')}>
              <FaArrowLeft className="me-2" /> Quay lại danh sách đơn hàng
            </Button>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" />
              </div>
            ) : order ? (
              <>
                <Card className="shadow-sm mb-3">
                  <Card.Header>
                    <h5 className="mb-0">Thông tin đơn hàng</h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <p><strong>Mã đơn hàng:</strong> {order.contractNumber || `HD-${order.id}`}</p>
                        <p><strong>Ngày tạo:</strong> {formatDate(order.createdAt)}</p>
                        <p><strong>Ngày giao hàng dự kiến:</strong> {formatDate(order.deliveryDate)}</p>
                      </Col>
                      <Col md={6}>
                        <p><strong>Trạng thái:</strong> <Badge bg={badge.variant}>{badge.label}</Badge></p>
                        <p><strong>Tổng tiền:</strong> <span className="text-success fw-bold">{formatCurrency(order.totalAmount)}</span></p>
                        {order.notes && (
                          <p><strong>Ghi chú:</strong> {order.notes}</p>
                        )}
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                <Card className="shadow-sm">
                  <Card.Header>
                    <h5 className="mb-0">Chi tiết sản phẩm</h5>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <Table responsive hover className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: '5%' }}>STT</th>
                          <th style={{ width: '35%' }}>Sản phẩm</th>
                          <th style={{ width: '10%' }} className="text-center">Số lượng</th>
                          <th style={{ width: '15%' }} className="text-center">Khối lượng (kg)</th>
                          <th style={{ width: '15%' }} className="text-end">Đơn giá</th>
                          <th style={{ width: '20%' }} className="text-end">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderDetails.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center py-4 text-muted">
                              Không có chi tiết sản phẩm.
                            </td>
                          </tr>
                        ) : (
                          orderDetails.map((item, idx) => {
                            const product = productDetails[item.productId];
                            const itemWeight = product ? (item.quantity * (product.standardWeight || 0)) / 1000 : 0;
                            return (
                              <tr key={item.id || idx}>
                                <td className="text-center">{idx + 1}</td>
                                <td>
                                  <div>{product?.name || 'Sản phẩm không xác định'}</div>
                                  <small className="text-muted">Kích thước: {product?.standardDimensions || 'N/A'}</small>
                                </td>
                                <td className="text-center">{item.quantity}</td>
                                <td className="text-center">{itemWeight.toFixed(2)}</td>
                                <td className="text-end">{formatCurrency(item.unitPrice || 0)}</td>
                                <td className="text-end fw-bold">{formatCurrency((item.unitPrice || 0) * item.quantity)}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      {orderDetails.length > 0 && (
                        <tfoot>
                          <tr>
                            <td colSpan="3" className="text-end fw-bold">TỔNG CỘNG:</td>
                            <td className="text-center fw-bold">{totalWeight.toFixed(2)}</td>
                            <td className="text-end fw-bold"></td>
                            <td className="text-end fw-bold">{formatCurrency(order.totalAmount)}</td>
                          </tr>
                        </tfoot>
                      )}
                    </Table>
                  </Card.Body>
                </Card>
              </>
            ) : (
              <Alert variant="info">Không tìm thấy đơn hàng.</Alert>
            )}
          </Container>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrderDetail;
