import React, { useEffect, useState } from "react";
import './MachineList.css';
import Navbar from "../../components/Navbar";
import { getAllMachines } from "../../services/machineApi";

const MachineList = () => {
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCreatePopup, setShowCreatePopup] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [newMachine, setNewMachine] = useState({
        machineCode: '',
        name: '',
        type: '',
        status: '',
        specification: '',
        maintenanceDate: '',
        nextMaintenance: '',
    });

    useEffect(() => {
        fetchMachines();
    }, []);

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewMachine(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCreateMachine = async (e) => {
        e.preventDefault();
        try {
            
            await createMachine(newMachine);
            alert("Tạo máy thành công!");
            setShowCreatePopup(false);
            fetchMachines();
            setNewMachine({
                machineCode: '',
                name: '',
                type: '',
                status: '',
                specification: '',
                maintenanceDate: '',
                nextMaintenance: '',
            });
        } catch (error) {
            alert("Lỗi khi tạo máy: " + error.message);
        }
    };

    
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = machines.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(machines.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="machine-page8">
            <Navbar />
            <main className="main-content8">
                <div className="header-bar8">
                    <button 
                        className="create-btn8" 
                        onClick={() => setShowCreatePopup(true)}
                    >
                        Tạo Máy Mới
                    </button>
                </div>

                {loading && <p className="loading8">Đang tải danh sách máy...</p>}
                {error && <p className="error8">{error}</p>}
                
                {!loading && !error && (
                    <div className="table-wrapper8">
                        <div className="table-header8">
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

                        {currentItems.map((machine) => (
                            <div className="table-row8" key={machine.id}>
                                <div>{machine.id}</div>
                                <div>{machine.machineCode}</div>
                                <div>{machine.name}</div>
                                <div>{machine.type}</div>
                                <div>{machine.status}</div>
                                <div>{machine.specification}</div>
                                <div>{new Date(machine.maintenanceDate).toLocaleDateString()}</div>
                                <div>{new Date(machine.nextMaintenance).toLocaleDateString()}</div>
                                <div>{new Date(machine.createdAt).toLocaleDateString()}</div>
                                <div>{new Date(machine.updatedAt).toLocaleDateString()}</div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="pagination8">
                    <button 
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        &lt;
                    </button>
                    {[...Array(totalPages)].map((_, index) => (
                        <button
                            key={index + 1}
                            onClick={() => paginate(index + 1)}
                            className={currentPage === index + 1 ? "active" : ""}
                        >
                            {index + 1}
                        </button>
                    ))}
                    <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        &gt;
                    </button>
                </div>

                {showCreatePopup && (
                    <div className="popup-overlay8">
                        <div className="popup8">
                            <h2 className="create-title8">Tạo Máy Mới</h2>
                            <form onSubmit={handleCreateMachine} className="create-form8">
                                <div className="form-group8">
                                    <label>Mã Máy</label>
                                    <input 
                                        type="text" 
                                        name="machineCode"
                                        value={newMachine.machineCode}
                                        onChange={handleChange}
                                        placeholder="Nhập mã máy"
                                        required
                                    />
                                </div>

                                <div className="form-group8">
                                    <label>Tên</label>
                                    <input 
                                        type="text" 
                                        name="name"
                                        value={newMachine.name}
                                        onChange={handleChange}
                                        placeholder="Nhập tên máy"
                                        required
                                    />
                                </div>

                                <div className="form-group8">
                                    <label>Loại</label>
                                    <input 
                                        type="text" 
                                        name="type"
                                        value={newMachine.type}
                                        onChange={handleChange}
                                        placeholder="Nhập loại máy"
                                        required
                                    />
                                </div>

                                <div className="form-group8">
                                    <label>Trạng thái</label>
                                    <select 
                                        name="status"
                                        value={newMachine.status}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Chọn trạng thái</option>
                                        <option value="AVAILABLE">Sẵn sàng</option>
                                        <option value="IN_USE">Đang sử dụng</option>
                                        <option value="MAINTENANCE">Bảo trì</option>
                                        <option value="BROKEN">Hỏng</option>
                                    </select>
                                </div>

                                <div className="form-group8 full-width8">
                                    <label>Thông số kỹ thuật</label>
                                    <textarea 
                                        name="specification"
                                        value={newMachine.specification}
                                        onChange={handleChange}
                                        placeholder="Nhập thông số kỹ thuật"
                                        required
                                    />
                                </div>

                                <div className="form-group8">
                                    <label>Bảo trì ngày</label>
                                    <input 
                                        type="date" 
                                        name="maintenanceDate"
                                        value={newMachine.maintenanceDate}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group8">
                                    <label>Bảo trì lần tới</label>
                                    <input 
                                        type="date" 
                                        name="nextMaintenance"
                                        value={newMachine.nextMaintenance}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="button-row8">
                                    <button type="submit" className="btn2 create-btn">
                                        Tạo Máy
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn2 back-btn"
                                        onClick={() => setShowCreatePopup(false)}
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MachineList;