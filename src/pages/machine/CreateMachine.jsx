import React from "react";
import "./CreateMachine.css";

const CreateMachine = () => {
  return (
    <div className="create-machine-page">
      <div className="create-machine-box">
        <h2 className="create-title">Tạo Máy Mới</h2>

        <form className="create-form">
          
            <div className="form-group">
              <label>Mã Máy</label>
              <input type="text" placeholder="Placeholder" />
            </div>
            <div className="form-group">
              <label>Tên</label>
              <input type="text" placeholder="Placeholder" />
            </div>
          

          
            <div className="form-group">
              <label>Loại</label>
              <input type="text" placeholder="Placeholder" />
            </div>
            <div className="form-group">
              <label>Trạng thái</label>
              <input type="text" placeholder="Placeholder" />
            </div>
          

          <div className="form-group full-width">
            <label>Thông số kỹ thuật</label>
            <input type="text" placeholder="Placeholder" />
          </div>

          <div className="form-group full-width">
            <label>Bảo trì ngày</label>
            <input type="text" placeholder="Placeholder" />
          </div>
          <div className="form-group full-width">
            <label>Bảo trì lần tới</label>
            <input type="text" placeholder="Placeholder" />
          </div>
          <div className="form-group full-width">
            <label>Tạo ngày</label>
            <input type="text" placeholder="Placeholder" />
          </div>
          <div className="form-group full-width">
            <label>Cập nhật ngày</label>
            <input type="text" placeholder="Placeholder" />
          </div>

          <div className="button-row">
            <button type="button" className="btn2 create-btn" style={{color: 'black'}}>
              Tạo Máy
            </button>
            <button type="button" className="btn2 back-btn">
              Quay Lại
            </button>
          </div>
        </form>

        <div className="close-section">
          <button className="btn2 close-btn">Đóng</button>
        </div>
      </div>
    </div>
  );
};

export default CreateMachine;
