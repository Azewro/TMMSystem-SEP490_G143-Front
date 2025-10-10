import React, { useEffect, useState } from "react";
import './MachineList.css';
import Navbar from "../../components/Navbar";
import { getAllMachines } from "../../services/machineApi";
const MachineList = () => {
    const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const data = await getAllMachines();
        setMachines(data); 
      } catch (err) {
        setError(err.message || "Lỗi khi tải danh sách máy");
      } finally {
        setLoading(false);
      }
    };

    fetchMachines();
  }, []);
  return (
    <div className="machine-page">
      <Navbar />
      <main className="main-content">
        <div className="header-bar">
          <a href="/createmachine"><button className="create-btn">Tạo Máy Mới</button></a>
        </div>
        {loading && <p>Đang tải danh sách máy...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && (
          <div className="table-wrapper">
            <div className="table-header">
              <div>ID</div>
              <div>Mã Máy</div>
              <div>Tên</div>
              <div>Loại</div>
              <div>Trạng thái</div>
              <div>Thông số kỹ thuật</div>
              <div>Bảo trì ngày</div>
              <div>Bảo trì lần tới</div>
              <div>Tạo ngày</div>
              <div>Cập nhật ngày</div>
            </div>

            {machines.map((machine) => (
              <div className="table-row" key={machine.id}>
                <div>{machine.id}</div>
                <div>{machine.machineCode}</div>
                <div>{machine.name}</div>
                <div>{machine.type}</div>
                <div>{machine.status}</div>
                <div>{machine.specification}</div>
                <div>{machine.maintenanceDate}</div>
                <div>{machine.nextMaintenance}</div>
                <div>{machine.createdAt}</div>
                <div>{machine.updatedAt}</div>
              </div>
            ))}
          </div>
        )}
        <div className="pagination">
          <button>&lt;</button>
          {[1, 2, 3, 4, 5].map((num) => (
            <button key={num} className={num === 1 ? "active" : ""}>
              {num}
            </button>
          ))}
          <button>&gt;</button>
        </div>
      </main>
    </div>
  );
};


export default MachineList;
