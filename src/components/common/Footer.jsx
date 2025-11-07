import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="bg-dark text-white mt-auto py-4">
      <Container>
        <Row>
          <Col md={4} className="mb-3 mb-md-0">
            <h5>TMM System</h5>
            <p className="text-muted">
              Chuyên cung cấp các giải pháp và sản phẩm khăn bông chất lượng cao.
            </p>
          </Col>
          <Col md={4} className="mb-3 mb-md-0">
            <h5>Liên kết</h5>
            <ul className="list-unstyled">
              <li><a href="/" className="text-white text-decoration-none">Trang chủ</a></li>
              <li><a href="#" className="text-white text-decoration-none">Về chúng tôi</a></li>
              <li><a href="#" className="text-white text-decoration-none">Liên hệ</a></li>
            </ul>
          </Col>
          <Col md={4}>
            <h5>Liên hệ</h5>
            <p className="text-muted">
              Email: support@tmmsystem.com<br />
              Điện thoại: (028) 3844 7207
            </p>
          </Col>
        </Row>
        <div className="text-center text-muted border-top border-secondary pt-3 mt-3">
          &copy; {new Date().getFullYear()} TMM System. All Rights Reserved.
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
