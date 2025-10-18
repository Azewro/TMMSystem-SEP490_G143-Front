import React from 'react';
import './ProductionOrderplanRoom.css';
import { FiPhone, FiMail } from "react-icons/fi";
import { FaUser } from "react-icons/fa";
const ProductionOrderplanRoom = () => {
    return (
        <div className="quote-page-container">
                                    <aside className="sidebar2">
                                        <div className="logo-container">
                                            <img src="/images/logo.png" alt="Logo" />
                                        </div>
                                        <ul className="menu2">
                                            <a href='/quoterequestplan' style={{ textDecoration: 'none' }}><li >Yêu cầu báo giá</li></a>
                                            
                                            <a href='/orderlistplanRoom' style={{ textDecoration: 'none' }}><li >Đơn hàng</li></a>
                                            <a  ><li className="active">Lệnh sản xuất</li></a>
                                            <a  ><li >Giải pháp rủi ro</li></a>
                                            <li>Ảnh hưởng giao hàng</li>
                                        </ul>
                                    </aside>
                                    <main className="main-content2">
                                                        
                                                        <section className="product-section" style={{marginBottom:'50px'}}>
                                                          <h2>Danh sách lệnh sản xuất</h2>           
                                                          
                                                <table className="quote-table">
                                                    <thead>
                                                      <tr>
                                                        <th>#</th>
                                                        <th>Mã lệnh sản xuất</th>                                                        
                                                        <th>Mã đơn hàng</th>
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
                                                          <a href='/productionorderdetailplan'><button><span>👁️</span>Xem</button>  </a>                   
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

export default ProductionOrderplanRoom;