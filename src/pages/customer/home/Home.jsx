import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom"; // ✅ điều hướng
import "./Home.css";
import { FiPhone, FiMail } from "react-icons/fi";
import { getAllCategories } from "../../../services/categoryApi";
import { getAllProducts } from "../../../services/productApi";
import { createRFQ } from "../../../services/rfqApi";

const Home = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [showCreateQuotePopup, setShowCreateQuotePopup] = useState(false);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [quoteData, setQuoteData] = useState({
    product: '',
    size: '',
    quantity: '',
    deliveryDate: ''
  });

 
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const customerId = storedUser?.customerId || 0;
  const token = storedUser?.accessToken || "";
  const role = storedUser?.role || "";

  
  useEffect(() => {
    if (role !== "CUSTOMER") {
      alert("🚫 Bạn không có quyền truy cập trang này!");
      navigate("/login"); // hoặc điều hướng đến trang bạn muốn
    }
  }, [role, navigate]);

 
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getAllCategories();
        setCategories(data);
      } catch (err) {
        console.error("Không thể tải danh mục:", err);
      }
    };
    fetchCategories();
  }, []);

  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getAllProducts();
        setProducts(data);
        setFilteredProducts(data);
      } catch (err) {
        console.error("Không thể tải sản phẩm:", err);
      }
    };
    fetchProducts();
  }, []);

  
  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    setSelectedCategory(categoryId);

    if (!categoryId) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        (product) => product.categoryId === parseInt(categoryId)
      );
      setFilteredProducts(filtered);
    }
  };

  
  const handleQuoteChange = (e) => {
    const { name, value } = e.target;

    if (name === "product") {
      const selectedProduct = products.find(p => p.id === parseInt(value));
      setQuoteData(prev => ({
        ...prev,
        product: value,
        size: selectedProduct ? selectedProduct.standardDimensions : ""
      }));
    } else {
      setQuoteData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  
  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    try {
      const rfqData = {
        rfqNumber: `RFQ-${Date.now()}`,
        customerId: customerId,
        expectedDeliveryDate: quoteData.deliveryDate,
        status: "DRAFT",
        isSent: true,
        notes: "Yêu cầu báo giá mới",
        createdById: customerId,
        approvedById: 0,
        details: [
          {
            productId: parseInt(quoteData.product),
            quantity: parseInt(quoteData.quantity),
            unit: "Cái",
            noteColor: "",
            notes: `Kích thước: ${quoteData.size}`,
          },
        ],
      };

      const result = await createRFQ(rfqData, token);
      console.log("Kết quả tạo RFQ:", result);

      alert("✅ Gửi yêu cầu báo giá thành công!");
      setShowCreateQuotePopup(false);
      setQuoteData({
        product: '',
        size: '',
        quantity: '',
        deliveryDate: ''
      });
    } catch (error) {
      console.error("Lỗi khi gửi RFQ:", error);
      alert("❌ Gửi yêu cầu thất bại: " + (error.message || "Lỗi không xác định"));
    }
  };

  
  if (role !== "CUSTOMER") {
    return (
      <div style={{ textAlign: "center", marginTop: "100px", fontSize: "18px" }}>
        🚫 Bạn không có quyền truy cập trang này.
      </div>
    );
  }

  return (
    <div className="home-container2">
      <aside className="sidebar2">
        <div className="logo2">
          <img src="/images/logo.png" alt="Dệt may Mỹ Đức" />
        </div>
        <nav className="menu2">
          <ul>
            <li className="active">Sản phẩm</li>
            <a href="/quote" style={{ textDecoration: 'none' }}><li>Yêu cầu báo giá</li></a>
            <a href="/order" style={{ textDecoration: 'none' }}><li>Đơn hàng</li></a>
          </ul>
        </nav>
      </aside>

      <main className="main-content2">
        <button
          className="quote-btn"
          style={{ width: '200px', marginLeft: '800px', marginBottom: '50px' }}
          onClick={() => setShowCreateQuotePopup(true)}
        >
          Tạo yêu cầu báo giá
        </button>

        <section className="product-section" style={{ marginBottom: '50px' }}>
          <h2>Danh sách sản phẩm</h2>
          <p style={{ marginBottom: '50px' }}>
            Chọn sản phẩm và gửi yêu cầu báo giá để nhận được giá tốt nhất
          </p>

          <div className="filter" style={{ marginBottom: '50px' }}>
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="category-select"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="product-list" style={{ marginBottom: '50px' }}>
            {filteredProducts.map((p) => (
              <div key={p.id} className="product-card">
                <div className="img-placeholder"></div>
                <h4>{p.name}</h4>
                <p>Đơn vị: {p.unit}</p>
                <p className="size">Kích thước: {p.standardDimensions}</p>
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
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '10px',
            alignItems: 'center', marginLeft: '400px'
          }}>
            <FiPhone /> Hotline: 0913 522 663
            <FiMail /> Email: contact@mvductowel.com
          </div>
        </footer>

        {/* Popup tạo yêu cầu báo giá */}
        {showCreateQuotePopup && (
          <div className="popup-overlay9">
            <div className="popup-content9">
              <div className="form-card9">
                <h2 className="form-title9">🧾 Tạo yêu cầu báo giá</h2>
                <p className="form-subtitle9">
                  Chọn sản phẩm, kích thước, số lượng và ngày giao hàng mong muốn.
                </p>

                <form onSubmit={handleSubmitQuote}>
                  <div className="form-group9">
                    <label>Sản phẩm</label>
                    <select
                      name="product"
                      value={quoteData.product}
                      onChange={handleQuoteChange}
                      className="input-field9"
                      required
                    >
                      <option value="">Chọn sản phẩm</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group9">
                    <label>Kích thước</label>
                    <input
                      type="text"
                      name="size"
                      value={quoteData.size}
                      className="input-field9"
                      readOnly
                    />
                  </div>

                  <div className="form-group9">
                    <label>Số lượng</label>
                    <input
                      type="number"
                      name="quantity"
                      value={quoteData.quantity}
                      onChange={handleQuoteChange}
                      placeholder="Nhập số lượng"
                      className="input-field9"
                      required
                    />
                  </div>

                  <div className="form-group9">
                    <label>Ngày giao hàng mong muốn</label>
                    <input
                      type="date"
                      name="deliveryDate"
                      value={quoteData.deliveryDate}
                      onChange={handleQuoteChange}
                      className="input-field9"
                      required
                    />
                  </div>

                  <div className="button-row9">
                    <button type="submit" className="submit-btn9">
                      Gửi yêu cầu báo giá
                    </button>
                    <button
                      type="button"
                      className="cancel-btn9"
                      onClick={() => setShowCreateQuotePopup(false)}
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
