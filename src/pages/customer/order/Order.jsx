import React from 'react';
import './Order.css';
import { FiPhone, FiMail } from "react-icons/fi";
import { FaUser } from "react-icons/fa";
const Order = () => {
    return (
        <div className="home-container2">
              <aside className="sidebar2">
                <div className="logo2">
                  <img src="/images/logo.png" alt="Dệt may Mỹ Đức" />
                </div>
                <nav className="menu2">
                  <ul>
                    <li >Sản phẩm</li>
                    <a href="/quote" style={{textDecoration:'none'}}><li>Yêu cầu báo giá</li></a>
                    <li className="active">Đơn hàng</li>
                    <li>Khách hàng</li>
                  </ul>
                </nav>
              </aside>
              <main className="main-content2">
                <header className="header2">
                  <input type="text" placeholder="Tìm kiếm sản phẩm..." />
                  <div className="user-info">
                    
                    <div className="user">
                      <i className="bell">🔔</i>
                      {/* <ProfilePopup /> */}
                      
                    </div>
                  </div>
                </header>
                <section className="product-section" style={{marginBottom:'50px'}}>
                  <h2>Danh sách đơn hàng</h2>
                  
        
                  <div className="filter" style={{marginBottom:'50px'}}>
                    <select>
                      <option>Tất cả danh mục</option>
                      <option>Khăn tắm</option>
                      <option>Khăn mặt</option>
                      <option>Khăn bếp</option>
                    </select>
                  </div>
                  <table className="quote-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Mã đơn hàng</th>
                    
                    <th>Ngày tạo</th>
                    <th>Tổng tiền (VND)</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>1</td>
                    <td>1</td>
                    <td>1</td>
                    <td>1</td>
                    
                    <td>
                      <a href='/orderdetail'><button><span>👁️</span>Xem</button>  </a>                   
                    </td>
                  </tr>
                </tbody>
              </table>
                  
        
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

export default Order;