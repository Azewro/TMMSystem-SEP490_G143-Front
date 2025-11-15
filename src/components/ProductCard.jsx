import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import '../styles/ProductCard.css';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const handleQuoteRequest = () => {
    navigate('/customer/quote-request', { 
      state: { preSelectedProduct: product } 
    });
  };

  const handleAddToCart = () => {
    addToCart(product);
    toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
  };

  return (
    <Card className="h-100 product-card">
      {/* Product Image */}
      <div className="product-image-container" style={{ height: '12.5rem', overflow: 'hidden' }}>
        <Card.Img
          variant="top"
          src={product.imageUrl || '/placeholder-product.jpg'}
          alt={product.name}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            backgroundColor: '#f8f9fa'
          }}
        />
      </div>

      <Card.Body className="d-flex flex-column">
        <Card.Title className="product-title">
          {product.name}
        </Card.Title>

        <Card.Text className="text-muted flex-grow-1">
          {product.description || 'Khăn tắm mềm mại, thấm hút tốt, bền đẹp.'}
        </Card.Text>

        <div className="product-details mb-3">
          <small className="text-muted d-block">
            <strong>Kích thước:</strong> {product.standardDimensions || '75x140cm'}
          </small>
        </div>

        <div className="mt-auto d-grid gap-2">
          {user && user.role === 'CUSTOMER' ? (
            <Button 
              variant="primary"
              onClick={handleAddToCart}
            >
              Thêm vào danh sách yêu cầu báo giá
            </Button>
          ) : (
            <Button 
              variant="primary" 
              onClick={handleQuoteRequest}
            >
              Yêu cầu báo giá
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;