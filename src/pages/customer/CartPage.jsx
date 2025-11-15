import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { Container, Row, Col, Card, Button, Form } from 'react-bootstrap';
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
  const [selectedItems, setSelectedItems] = useState(new Set(cartItems.map(item => item.id)));

  // Update selectedItems when cartItems change
  useEffect(() => {
    const currentItemIds = new Set(cartItems.map(item => item.id));
    // Only keep selected items that still exist in cart
    setSelectedItems(prev => {
      const newSet = new Set();
      prev.forEach(id => {
        if (currentItemIds.has(id)) {
          newSet.add(id);
        }
      });
      // If no items selected, select all by default
      if (newSet.size === 0 && cartItems.length > 0) {
        return currentItemIds;
      }
      return newSet;
    });
  }, [cartItems]);

  const handleToggleSelect = (itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartItems.map(item => item.id)));
    }
  };

  const handleProceedToQuote = () => {
    const selectedProducts = cartItems.filter(item => selectedItems.has(item.id));
    if (selectedProducts.length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm để gửi yêu cầu báo giá.');
      return;
    }
    // Navigate to the quote request page with the selected cart items
    navigate('/customer/quote-request', { state: { cartProducts: selectedProducts } });
  };

  return (
    <div className="customer-layout" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div className="d-flex flex-grow-1" style={{ minHeight: 0 }}>
        {isAuthenticated && <Sidebar />}
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Container fluid className="p-4 flex-grow-1" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
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
              <Row className="flex-grow-1" style={{ minHeight: 0 }}>
                <Col lg={8} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <div className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Chọn tất cả"
                      checked={selectedItems.size === cartItems.length && cartItems.length > 0}
                      onChange={handleSelectAll}
                    />
                  </div>
                  <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                    {cartItems.map(item => (
                      <CartItemRow 
                        key={item.id} 
                        item={item} 
                        isSelected={selectedItems.has(item.id)}
                        onToggleSelect={() => handleToggleSelect(item.id)}
                      />
                    ))}
                  </div>
                </Col>
                <Col lg={4}>
                  <Card>
                    <Card.Body>
                      <Card.Title>Tổng Quan</Card.Title>
                      <Card.Text>
                        <strong>Tổng số sản phẩm:</strong> {itemCount}
                      </Card.Text>
                      <Card.Text>
                        <strong>Đã chọn:</strong> {selectedItems.size} sản phẩm
                      </Card.Text>
                      <div className="d-grid gap-2">
                        <Button variant="primary" onClick={handleProceedToQuote} disabled={selectedItems.size === 0}>
                          Gửi Yêu Cầu Báo Giá ({selectedItems.size})
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
      </div>
    </div>
  );
};

export default CartPage;
