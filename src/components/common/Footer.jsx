import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FaFacebook, FaYoutube, FaTiktok } from 'react-icons/fa';
import '../../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="main-footer">
      <Container>
        <Row>
          <Col lg={4} md={12} className="mb-4 mb-lg-0">
            <img src="/logo.png" alt="TMM System Logo" className="footer-logo" />
            <p>
              Nhà cung cấp giải pháp và sản phẩm khăn bông chất lượng cao hàng đầu cho khách sạn, spa và gia đình.
            </p>
          </Col>
          <Col lg={2} md={6} className="mb-4 mb-md-0">
            <h5>Sản phẩm</h5>
            <ul className="list-unstyled">
              <li><a href="#">Khăn khách sạn</a></li>
              <li><a href="#">Khăn Spa</a></li>
              <li><a href="#">Khăn quà tặng</a></li>
              <li><a href="#">Khăn gia đình</a></li>
            </ul>
          </Col>
          <Col lg={3} md={6} className="mb-4 mb-md-0">
            <h5>Công ty</h5>
            <ul className="list-unstyled">
              <li><a href="#">Về chúng tôi</a></li>
              <li><a href="#">Tuyển dụng</a></li>
              <li><a href="#">Chính sách & Điều khoản</a></li>
            </ul>
          </Col>
          <Col lg={3} md={12}>
            <h5>Liên hệ</h5>
            <p>
              <strong>Địa chỉ:</strong> Lô CN2, Cụm công nghiệp, Ba Hàng, Phổ Yên, Thái Nguyên<br />
              <strong>Email:</strong> support@tmmsystem.com<br />
              <strong>Điện thoại:</strong> 0904.862.166 / 098.172.5788
            </p>
          </Col>
        </Row>
        <div className="footer-bottom d-flex justify-content-between align-items-center">
          <span>&copy; {new Date().getFullYear()} TMM System. All Rights Reserved.</span>
          <div className="social-icons">
            <a href="#"><FaFacebook /></a>
            <a href="#"><FaYoutube /></a>
            <a href="#"><FaTiktok /></a>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
