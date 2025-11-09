import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Button, Alert, Badge, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { rfqService } from '../../api/rfqService';
import { productService } from '../../api/productService';

const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('vi-VN') : 'N/A';

const CustomerRfqDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [rfq, setRfq] = useState(null);
  const [productDetails, setProductDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const rfqData = await rfqService.getRfqById(parseInt(id, 10));
        
        if (rfqData.details && rfqData.details.length > 0) {
          const productPromises = rfqData.details.map(item => 
            productService.getProductById(item.productId)
          );
          const products = await Promise.all(productPromises);
          
          const productsMap = products.reduce((acc, product) => {
            acc[product.id] = product;
            return acc;
          }, {});
          setProductDetails(productsMap);
        }
        
        setRfq(rfqData);

      } catch (e) {
        setError(e.message || 'Không thể tải chi tiết yêu cầu báo giá');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'DRAFT': return { text: 'Bản nháp', bg: 'secondary' };
      case 'SENT': return { text: 'Đã gửi', bg: 'primary' };
      case 'PROCESSING': return { text: 'Đang xử lý', bg: 'info' };
      case 'DONE': return { text: 'Hoàn thành', bg: 'success' };
      case 'REJECTED': return { text: 'Đã từ chối', bg: 'danger' };
      default: return { text: status || 'Không xác định', bg: 'dark' };
    }
  };

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <Sidebar />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <Button variant="outline-secondary" className="mb-3" onClick={() => navigate('/customer/quote-requests')}>
              <FaArrowLeft className="me-2" /> Quay lại danh sách
            </Button>

            {error && <Alert variant="danger" onClose={()=>setError('')} dismissible>{error}</Alert>}

            {loading ? (
              <div className="text-center py-5"><Spinner animation="border" /></div>
            ) : rfq ? (
              <Card className="shadow-sm">
                <Card.Header className="bg-light p-3 d-flex justify-content-between align-items-center">
                  <h4 className="mb-0">Chi tiết Yêu cầu Báo giá #{rfq.rfqNumber || rfq.id}</h4>
                  <Badge bg={getStatusBadge(rfq.status).bg}>{getStatusBadge(rfq.status).text}</Badge>
                </Card.Header>
                <Card.Body className="p-4">
                  <div className="mb-4">
                      <p><strong>Ngày tạo:</strong> {formatDate(rfq.createdAt)}</p>
                      <p><strong>Ngày giao hàng mong muốn:</strong> {formatDate(rfq.expectedDeliveryDate)}</p>
                      {rfq.notes && <p><strong>Ghi chú của khách hàng:</strong> {rfq.notes}</p>}
                  </div>

                  <h5 className="mb-3">Sản phẩm yêu cầu</h5>
                  <Table striped bordered hover responsive>
                    <thead className="table-light">
                      <tr className="text-center">
                        <th style={{ width: '5%' }}>STT</th>
                        <th style={{ width: '65%' }}>THÔNG TIN SẢN PHẨM</th>
                        <th style={{ width: '30%' }}>SỐ LƯỢNG YÊU CẦU</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rfq.details && rfq.details.map((item, idx) => {
                        const product = productDetails[item.productId];
                        return (
                          <tr key={item.id || idx}>
                            <td className="text-center">{idx + 1}</td>
                            <td>
                              <div>{product?.name || 'Sản phẩm không xác định'}</div>
                              <small className="text-muted">Kích thước: {product?.standardDimensions || 'N/A'}</small>
                            </td>
                            <td className="text-center">{item.quantity}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            ) : (
              <div className="text-center py-5 text-muted">Không tìm thấy yêu cầu báo giá.</div>
            )}
            
          </Container>
        </div>
      </div>
    </div>
  );
};

export default CustomerRfqDetail;
