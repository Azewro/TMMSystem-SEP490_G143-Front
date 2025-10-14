import React from 'react';
import './QuoteSale.css';
import { FiPhone, FiMail } from "react-icons/fi";
import { FaUser } from "react-icons/fa";
const QuoteSale = () => {
    return (
        <div className="quote-page-container">
            <aside className="sidebar2">
                <div className="logo-container">
                    <img src="/images/logo.png" alt="Logo" />
                </div>
                <ul className="menu2">
                    <a href='/quoterequestsale' style={{ textDecoration: 'none' }}><li >Yêu cầu báo giá</li></a>
                    <li className="active">Báo giá</li>
                    <a href='/orderlist' style={{ textDecoration: 'none' }}><li>Đơn hàng</li></a>
                    <li>Ảnh hưởng giao hàng</li>
                </ul>
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
                                  <h2>Danh sách báo giá</h2>           
                                  
                        <table className="quote-table">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Mã báo giá</th>
                                <th>Người đại diện</th>
                                <th>Ngày tạo đơn</th>
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

export default QuoteSale;