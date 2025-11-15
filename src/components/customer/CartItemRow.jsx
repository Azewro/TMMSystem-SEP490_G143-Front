import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Image, Form } from 'react-bootstrap';
import { FaTrash } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';

const CartItemRow = ({ item, isSelected, onToggleSelect }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const [localQuantity, setLocalQuantity] = useState(item.quantity);

  // Update local quantity if item.quantity changes from outside (e.g., clear cart)
  useEffect(() => {
    setLocalQuantity(item.quantity);
  }, [item.quantity]);

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    setLocalQuantity(value); // Update local state immediately for smooth typing
  };

  const handleQuantityBlur = () => {
    let newQuantity = parseInt(localQuantity, 10);
    if (isNaN(newQuantity) || newQuantity < 1) {
      newQuantity = 1; // Default to 1 if invalid
    }
    setLocalQuantity(newQuantity); // Update local state to clean value
    updateQuantity(item.id, newQuantity); // Update global state
  };

  const handleRemoveClick = () => {
    removeFromCart(item.id);
  };

  return (
    <Card key={item.id} className="mb-3">
      <Card.Body>
        <Row className="align-items-center">
          <Col md={1}>
            <Form.Check
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
            />
          </Col>
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
              value={localQuantity}
              onChange={handleQuantityChange}
              onBlur={handleQuantityBlur}
              min="1"
              style={{ width: '80px' }}
            />
          </Col>
          <Col md={1} className="text-end">
            <Button variant="danger" size="sm" onClick={handleRemoveClick}>
              <FaTrash />
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default CartItemRow;