import React from 'react';
import { FiPhone, FiMail } from "react-icons/fi";
import { FaUser } from "react-icons/fa";
import './QuoteRequestSale.css';
const QuoteRequestSale = () => {
    return (
        <div className="quote-page-container">
            <aside className="sidebar2">
                <div className="logo-container">
                    <img src="/images/logo.png" alt="Logo" />
                </div>
                <ul className="menu2">
                    <li className="active">Yêu cầu báo giá</li>
                    <a href='/quotesale' style={{ textDecoration: 'none' }}><li >Báo giá</li></a>
                    <li>Đơn hàng</li>
                    <li>Ảnh hưởng giao hàng</li>
                </ul>
            </aside>
            <main className="main-content2">
                    
                    <section className="product-section" style={{marginBottom:'50px'}}>
                      <h2>Danh sách yêu cầu báo giá</h2>           
                      <div className="filter" style={{marginBottom:'50px'}}>
                        <select>
                          <option>Tất cả trạng thái</option>
                          <option>Chờ xử lý</option>
                          <option>Đã duyệt</option>
                          <option>Đã gửi</option>
                          <option>Từ chối</option>
                        </select>
                      </div>
            <table className="quote-table">
                <thead>
                  <tr>
                    <th>Mã RFQ</th>
                    <th>Người đại diện</th>
                    <th>Công ty</th>
                    <th>Ngày tạo đơn</th>
                    <th>Số lượng sản phẩm</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>1</td>
                    <td>1</td>
                    <td>1</td>
                    <td>1</td>
                    <td>1</td>
                    <td>
                      <a href='/quotedetailsale'><button><span>👁️</span>Chi tiết</button>  </a>                   
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

export default QuoteRequestSale;