import React from 'react';
import { useCart } from '../../context/CartContext';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';
import Sidebar from '../../components/common/Sidebar';
import { useAuth } from '../../context/AuthContext';
import CartItemRow from '../../components/customer/CartItemRow'; // Import new component

const CartPage = () => {
  const { cartItems, clearCart, itemCount } = useCart();
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
                <CartItemRow key={item.id} item={item} />
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
