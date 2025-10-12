import React from "react";
import "./Home.css";
import { FiPhone, FiMail } from "react-icons/fi";
import { FaUser } from "react-icons/fa";
import ProfilePopup from "../../../components/ProfilePopup/ProfilePopup";
const Home = () => {
  return (
    <div className="home-container2">
      <aside className="sidebar2">
        <div className="logo2">
          <img src="/images/logo.png" alt="Dệt may Mỹ Đức" />
        </div>
        <nav className="menu2">
          <ul>
            <li className="active">Sản phẩm</li>
            <a href="/quote" style={{textDecoration:'none'}}><li>Yêu cầu báo giá</li></a>
            <li>Đơn hàng</li>
            <li>Khách hàng</li>
          </ul>
        </nav>
      </aside>
      <main className="main-content2">
        <header className="header2">
          <input type="text" placeholder="Tìm kiếm sản phẩm..." />
          <div className="user-info">
            <button className="quote-btn">Tạo yêu cầu báo giá</button>
            <div className="user">
              <i className="bell">🔔</i>
              <ProfilePopup />
              
            </div>
          </div>
        </header>
        <section className="product-section" style={{marginBottom:'50px'}}>
          <h2>Danh sách sản phẩm</h2>
          <p style={{marginBottom:'50px'}}>Chọn sản phẩm và gửi yêu cầu báo giá để nhận được giá tốt nhất</p>

          <div className="filter" style={{marginBottom:'50px'}}>
            <select>
              <option>Tất cả danh mục</option>
              <option>Khăn tắm</option>
              <option>Khăn mặt</option>
              <option>Khăn bếp</option>
            </select>
          </div>

          <div className="product-list" style={{marginBottom:'50px'}}>
            {[1, 2, 3].map((item) => (
              <div key={item} className="product-card">
                <div className="img-placeholder"></div>
                <h4>Khăn mặt hoa cotton</h4>
                <p>Khăn tắm mềm mại, thấm hút tốt, bền đẹp.</p>
                <p className="size">Kích thước: 70x140cm</p>
                <button className="add-btn">Thêm vào báo giá</button>
              </div>
            ))}
          </div>

          <div className="pagination">
            <button>&lt;</button>
            <button className="active">1</button>
            <button>2</button>
            <button>3</button>
            <button>&gt;</button>
          </div>
        </section>
        <footer className="footer">
          <div style={{display:'flex', flexDirection:'column', gap:'10px', alignItems:'center',marginLeft:'400px'}}>
            <FiPhone /> Hotline: 0913 522 663
            <FiMail /> Email: contact@mvductowel.com
          </div>         
        </footer>
      </main>
    </div>
  );
};

export default Home;
