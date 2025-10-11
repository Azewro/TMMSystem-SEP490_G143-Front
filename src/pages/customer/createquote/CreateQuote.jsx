import React from 'react';
import './CreateQuote.css';
const CreateQuote = () => {
   return (
    <div className="create-quote-container">
      <div className="form-card">
        <h2 className="form-title">🧾 Tạo yêu cầu báo giá</h2>
        <p className="form-subtitle">
          Chọn sản phẩm, kích thước, số lượng và ngày giao hàng mong muốn.
        </p>

        <div className="form-group">
          <label>Sản phẩm</label>
          <select className="input-field error">
            <option>Chọn sản phẩm</option>
          </select>
        </div>

        <div className="form-group">
          <label>Kích thước</label>
          <select className="input-field error">
            <option>Chọn sản phẩm trước</option>
          </select>
        </div>

        <div className="form-group">
          <label>Số lượng</label>
          <input
            type="number"
            placeholder="Nhập số lượng"
            className="input-field error"
          />
        </div>

        <button className="add-btn">+ Thêm sản phẩm</button>

        <div className="form-group">
          <label>Ngày giao hàng mong muốn</label>
          <input
            type="date"
            placeholder="dd/mm/yyyy"
            className="input-field error"
          />
        </div>

        <div className="submit-container">
          <button className="submit-btn">Gửi yêu cầu báo giá</button>
        </div>
      </div>
    </div>
  );
};

export default CreateQuote;