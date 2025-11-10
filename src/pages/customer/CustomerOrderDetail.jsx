import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';

const CustomerOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <Sidebar />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <Button variant="outline-secondary" className="mb-3" onClick={() => navigate('/customer/orders')}>
              &larr; Quay lại danh sách đơn hàng
            </Button>
            <Card>
              <Card.Header>
                <Card.Title>Chi tiết Đơn hàng #{id}</Card.Title>
              </Card.Header>
              <Card.Body>
                <p>Trang chi tiết đơn hàng đang được xây dựng.</p>
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrderDetail;
