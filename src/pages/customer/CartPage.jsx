import React from 'react';
import { useCart } from '../../context/CartContext';
import { Container, Row, Col, Card, Button, Image, Form } from 'react-bootstrap';
import { FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';
import Sidebar from '../../components/common/Sidebar';
import { useAuth } from '../../context/AuthContext';

const CartPage = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart, itemCount } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleProceedToQuote = () => {
    // Navigate to the quote request page with the cart items
    navigate('/customer/quote-request', { state: { cartProducts: cartItems } });
  };

  const MainContent = () => (
    <div className="flex-grow-1">
      <Container className="my-5">
        <h1 className="mb-4">Giỏ Hàng Của Bạn</h1>
        {itemCount === 0 ? (
          <Card className="text-center p-5">
            <Card.Body>
              <Card.Title>Giỏ hàng của bạn đang trống</Card.Title>
              <Card.Text>
                Hãy quay lại trang chủ để lựa chọn những sản phẩm tuyệt vời nhé.
              </Card.Text>
              <Button variant="primary" onClick={() => navigate('/')}>
                Quay lại trang chủ
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <Row>
            <Col lg={8}>
              {cartItems.map(item => (
                <Card key={item.id} className="mb-3">
                  <Card.Body>
                    <Row className="align-items-center">
                      <Col md={2}>
                        <Image src={item.imageUrl || '/placeholder-product.jpg'} thumbnail />
                      </Col>
                      <Col md={4}>
                        <h5>{item.name}</h5>
                        <p className="text-muted mb-0">Kích thước: {item.standardDimensions}</p>
                      </Col>
                      <Col md={3}>
                        <Form.Control
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value, 10))}
                          min="1"
                          style={{ width: '80px' }}
                        />
                      </Col>
                      <Col md={2}>
                        {/* Placeholder for price if available */}
                      </Col>
                      <Col md={1} className="text-end">
                        <Button variant="danger" size="sm" onClick={() => removeFromCart(item.id)}>
                          <FaTrash />
                        </Button>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              ))}
            </Col>
            <Col lg={4}>
              <Card>
                <Card.Body>
                  <Card.Title>Tổng Quan</Card.Title>
                  <Card.Text>
                    <strong>Tổng số sản phẩm:</strong> {itemCount}
                  </Card.Text>
                  <div className="d-grid gap-2">
                    <Button variant="primary" onClick={handleProceedToQuote}>
                      Gửi Yêu Cầu Báo Giá
                    </Button>
                    <Button variant="outline-danger" onClick={clearCart}>
                      Xóa tất cả
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
      <Footer />
    </div>
  );

  return (
    <>
      <Header />
      <div className="d-flex">
        {isAuthenticated && <Sidebar />}
        <MainContent />
      </div>
    </>
  );
};

export default CartPage;
