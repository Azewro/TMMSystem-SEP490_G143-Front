import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Spinner } from 'react-bootstrap';
import { productService } from '../../api/productService';

const AddProductToRfqModal = ({ show, onHide, onAddProduct }) => {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  
  const [productDetails, setProductDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (show) {
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
      setQuantity(1);
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
    const selectedProduct = products.find(p => p.id === parseInt(selectedProductId, 10));
    if (!selectedProduct) return;
    
    const newProduct = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: parseInt(quantity, 10),
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
                type="number" 
                value={quantity} 
                onChange={(e) => setQuantity(Math.max(1, e.target.value))} 
                min="1"
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
