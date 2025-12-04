import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { productService } from '../../api/productService';
import { handleIntegerKeyPress, sanitizeNumericInput } from '../../utils/validators';

const AddProductToRfqModal = ({ show, onHide, onAddProduct }) => {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');

  const [productDetails, setProductDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [quantity, setQuantity] = useState(100);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
      setError('');
      const fetchProducts = async () => {
        try {
          const data = await productService.getAllProducts();
          setProducts(data || []);
        } catch (error) {
          console.error("Failed to fetch products:", error);
        }
      };
      fetchProducts();
    } else {
      // Reset form on hide
      setSelectedProductId('');
      setProductDetails(null);
      setQuantity(100);
      setError('');
    }
  }, [show]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!selectedProductId) {
        setProductDetails(null);
        return;
      }
      setLoadingDetails(true);
      try {
        const details = await productService.getProductById(selectedProductId);
        setProductDetails(details);
      } catch (error) {
        console.error("Failed to fetch product details:", error);
        setProductDetails(null);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [selectedProductId]);

  const handleSubmit = () => {
    setError('');
    if (!selectedProductId) {
      setError('Vui lòng chọn sản phẩm.');
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 100) {
      setError('Số lượng phải từ 100 trở lên.');
      return;
    }

    const selectedProduct = products.find(p => p.id === parseInt(selectedProductId, 10));
    if (!selectedProduct) return;

    const newProduct = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: qty,
      unit: 'pcs',
      // Use the standard dimension from the fetched details for the notes field
      notes: productDetails?.standardDimensions || 'Tiêu chuẩn',
    };
    onAddProduct(newProduct);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Thêm sản phẩm vào Yêu cầu</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form>
          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={4}>Sản phẩm</Form.Label>
            <Col sm={8}>
              <Form.Select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                <option value="">Chọn sản phẩm...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Form.Select>
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={4}>Kích thước</Form.Label>
            <Col sm={8}>
              <Form.Control
                type="text"
                readOnly
                value={loadingDetails ? 'Đang tải...' : (productDetails?.standardDimensions || 'Vui lòng chọn sản phẩm')}
                placeholder="Kích thước tiêu chuẩn"
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={4}>Số lượng</Form.Label>
            <Col sm={8}>
              <Form.Control
                type="text"
                inputMode="numeric"
                value={quantity}
                onChange={(e) => {
                  const sanitized = sanitizeNumericInput(e.target.value, false);
                  if (sanitized) {
                    const num = parseInt(sanitized, 10);
                    setQuantity(isNaN(num) || num < 100 ? 100 : num);
                  } else {
                    setQuantity(100);
                  }
                }}
                onKeyPress={handleIntegerKeyPress}
                placeholder="Tối thiểu 100"
              />
            </Col>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Hủy</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!selectedProductId}>
          Thêm sản phẩm
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddProductToRfqModal;
