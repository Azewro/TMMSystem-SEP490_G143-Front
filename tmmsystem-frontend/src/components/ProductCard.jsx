import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  const handleQuoteRequest = () => {
    navigate('/customer/quote-request', { 
      state: { preSelectedProduct: product } 
    });
  };

  return (
    <Card className="h-100 shadow-sm product-card">
      {/* Product Image */}
      <div className="product-image-container" style={{ height: '200px', overflow: 'hidden' }}>
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
        <Card.Title className="product-title" style={{ fontSize: '1.1em', fontWeight: '600' }}>
          {product.name}
        </Card.Title>

        <Card.Text className="text-muted flex-grow-1" style={{ fontSize: '0.9em' }}>
          {product.description || 'Khăn tắm mềm mại, thấm hút tốt, bền đẹp.'}
        </Card.Text>

        {/* Product Details - Only dimensions */}
        <div className="product-details mb-3">
          <small className="text-muted d-block">
            <strong>Kích thước:</strong> {product.standardDimensions || '75x140cm'}
          </small>
        </div>

        <Button 
          variant="primary" 
          className="mt-auto"
          onClick={handleQuoteRequest}
        >
          Yêu cầu báo giá
        </Button>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;
