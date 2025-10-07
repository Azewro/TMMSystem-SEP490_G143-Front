import React from 'react';
import './Blog.css';
import { FacebookOutlined, InstagramOutlined, TwitterOutlined } from '@ant-design/icons';

const Blog = () => {
    return (
    <div className="handmade-page">
      <header className="header1">
        <div className="menu">☰</div>
        <div className="header-content">
          <h1>Khăn bông<br />Mỹ Đức</h1>          
        </div>
      </header>
      <section className="about">
        <h2>Về chúng tôi</h2>
        <p>
          Chuyên sản xuất và phân phối các dòng sản phẩm về khăn. ✓ Nhận gia công sản xuất khăn mặt, khăn tắm, thảm, áo choàng tắm ✓ Nhận thêu, in chữ, logo, slogan ...
        </p>
      </section>
      <section className="products">
        <div className="left-box">
          <img src="https://khanthudo.com/wp-content/uploads/2020/05/Xuong-san-xuat-khan.jpg" alt="Gift ideas" />
          <div className="text-box">
            <h3>Chất lượng</h3>
            <p>Đảm bảo chất lượng và uy tín về sản phẩm</p>
            <button>Xem thêm</button>
          </div>
        </div>

        <div className="right-box">
          <div className="text-box">
            <h3>Công nghệ sản xuất</h3>
            <p>Khăn bông được sản xuất bằng máy kết hợp thủ công</p>
            <button>Xem thêm</button>
          </div>
          <img src="https://lh3.googleusercontent.com/proxy/MZRkvTCM6LUwJxzDtabfdk79tMObNGzIYbvn8-WyKf1R2RXOLDuRwKhDIR2mwdXQBd0-_fKelS_KNk3-AqcUpLmlfEcrcf7YcfJJPVLQ" alt="Tools" />
        </div>
      </section>
      <footer className="footer">
        <div className="footer-links">
          <a href="#">Trang chủ</a>
          <a href="#">Liên hệ</a>
          <a href="#">Sản phẩm</a>
        </div>
        <div className="social">
          <TwitterOutlined style={{ fontSize: '24px', color: '#faf7f7ff' }} />Twitter
                <FacebookOutlined style={{ fontSize: '24px', color: '#faf7f7ff' }} />Facebook
                <InstagramOutlined style={{ fontSize: '24px', color: '#faf7f7ff' }} />Instagram
        </div>
      </footer>
    </div>
  );
};

export default Blog;