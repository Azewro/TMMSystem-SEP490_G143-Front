/**
 * Status mapping utilities for mapping backend status to Vietnamese labels
 * and determining button actions based on status and user role
 */

// Map backend status to Vietnamese display label
export const getStatusLabel = (status) => {
  const statusMap = {
    // ProductionOrder statuses
    'PENDING_APPROVAL': 'Chờ phê duyệt',
    'WAITING_PRODUCTION': 'Chờ sản xuất',
    'CHO_SAN_XUAT': 'Chờ sản xuất',
    'DANG_SAN_XUAT': 'Đang sản xuất',
    'IN_PROGRESS': 'Đang sản xuất',
    'ORDER_COMPLETED': 'Hoàn thành',
    'COMPLETED': 'Hoàn thành',
    'HOAN_THANH': 'Hoàn thành',

    // ProductionStage statuses
    'PENDING': 'đợi',
    'WAITING': 'chờ làm',
    'READY': 'sẵn sàng sản xuất',
    'READY_TO_PRODUCE': 'sẵn sàng sản xuất',
    'IN_PROGRESS': 'đang làm',
    'WAITING_QC': 'chờ kiểm tra',
    'QC_IN_PROGRESS': 'đang kiểm tra',
    'QC_PASSED': 'đạt',
    'QC_FAILED': 'không đạt',
    'WAITING_REWORK': 'chờ sửa',
    'REWORK_IN_PROGRESS': 'đang sửa',
    'PAUSED': 'Tạm dừng',
    'WAITING_MATERIAL': 'Chờ phê duyệt cấp sợi', // Frontend-only status
  };
  return statusMap[status] || status;
};



// Map stage type code to Vietnamese name
export const getStageTypeName = (stageType) => {
  const stageTypeMap = {
    'WARPING': 'Cuồng mắc',
    'CUONG_MAC': 'Cuồng mắc',
    'WEAVING': 'Dệt',
    'DET': 'Dệt',
    'DYEING': 'Nhuộm',
    'NHUOM': 'Nhuộm',
    'CUTTING': 'Cắt',
    'CAT': 'Cắt',
    'HEMMING': 'May',
    'MAY': 'May',
    'PACKAGING': 'Đóng gói',
    'DONG_GOI': 'Đóng gói',
  };
  return stageTypeMap[stageType] || stageType;
};

// Get button configuration based on stage status and user role
export const getButtonForStage = (status, userRole) => {
  if (userRole === 'leader') {
    // PENDING: đợi - không có button
    if (status === 'PENDING') {
      return { text: 'Chờ', action: 'none', variant: 'secondary', disabled: true };
    }
    // WAITING/READY/READY_TO_PRODUCE: sẵn sàng sản xuất - button "Bắt đầu"
    if (status === 'WAITING' || status === 'READY' || status === 'READY_TO_PRODUCE') {
      return { text: 'Bắt đầu', action: 'start', variant: 'success', disabled: false };
    }
    // IN_PROGRESS: đang làm - button "Cập nhật tiến độ"
    if (status === 'IN_PROGRESS') {
      return { text: 'Cập nhật tiến độ', action: 'update', variant: 'primary', disabled: false };
    }
    // WAITING_QC: chờ kiểm tra - button "Xem chi tiết"
    if (status === 'WAITING_QC') {
      return { text: 'Xem chi tiết', action: 'detail', variant: 'outline-secondary', disabled: false };
    }
    // QC_IN_PROGRESS: đang kiểm tra - button "Xem chi tiết"
    if (status === 'QC_IN_PROGRESS') {
      return { text: 'Xem chi tiết', action: 'detail', variant: 'outline-secondary', disabled: false };
    }
    // QC_PASSED: đạt - button "Xem chi tiết"
    if (status === 'QC_PASSED') {
      return { text: 'Xem chi tiết', action: 'detail', variant: 'outline-secondary', disabled: false };
    }
    // QC_FAILED: không đạt - button "Xem chi tiết"
    if (status === 'QC_FAILED') {
      return { text: 'Xem chi tiết', action: 'detail', variant: 'outline-secondary', disabled: false };
    }
    // WAITING_REWORK: chờ sửa - button "Bắt đầu"
    if (status === 'WAITING_REWORK') {
      return { text: 'Bắt đầu', action: 'start', variant: 'warning', disabled: false };
    }
    // REWORK_IN_PROGRESS: đang sửa - button "Cập nhật tiến độ"
    if (status === 'REWORK_IN_PROGRESS') {
      return { text: 'Cập nhật tiến độ', action: 'update', variant: 'primary', disabled: false };
    }
    // PAUSED: tạm dừng - không có button (theo yêu cầu Leader > Danh sách đơn hàng)
    if (status === 'PAUSED') {
      return { text: 'Tạm dừng', action: 'none', variant: 'secondary', disabled: true };
    }
    // COMPLETED: hoàn thành - button "Xem chi tiết"
    if (status === 'COMPLETED') {
      return { text: 'Xem chi tiết', action: 'detail', variant: 'outline-secondary', disabled: false };
    }
  }

  if (userRole === 'qa' || userRole === 'kcs') {
    // WAITING_QC: chờ kiểm tra - button "Kiểm tra"
    if (status === 'WAITING_QC') {
      return { text: 'Kiểm tra', action: 'inspect', variant: 'warning' };
    }
    // QC_IN_PROGRESS: đang kiểm tra - button "Kiểm tra"
    if (status === 'QC_IN_PROGRESS') {
      return { text: 'Kiểm tra', action: 'inspect', variant: 'warning' };
    }
    // QC_PASSED: đạt - button "Chi tiết"
    if (status === 'QC_PASSED') {
      return { text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' };
    }
    // QC_FAILED: không đạt - button "Chi tiết"
    if (status === 'QC_FAILED') {
      return { text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' };
    }
    return { text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' };
  }

  if (userRole === 'production' || userRole === 'pm') {
    // For dyeing stage (NHUOM) managed by PM
    if (status === 'PENDING') {
      return { text: '', action: 'none', variant: 'secondary', disabled: true };
    }
    if (status === 'WAITING' || status === 'READY' || status === 'READY_TO_PRODUCE') {
      return { text: 'Bắt đầu', action: 'start', variant: 'success' };
    }
    if (status === 'IN_PROGRESS') {
      return { text: 'Cập nhật tiến độ', action: 'update', variant: 'primary' };
    }
    if (status === 'WAITING_REWORK') {
      return { text: 'Bắt đầu', action: 'start', variant: 'warning' };
    }
    if (status === 'REWORK_IN_PROGRESS') {
      return { text: 'Cập nhật tiến độ', action: 'update', variant: 'primary' };
    }
    // Default fallback
    return { text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' };
  }

  return { text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' };
};

// Get status badge variant for Bootstrap
export const getStatusVariant = (status) => {
  const variantMap = {
    // ProductionOrder statuses
    'PENDING_APPROVAL': 'secondary',
    'WAITING_PRODUCTION': 'secondary',
    'CHO_SAN_XUAT': 'secondary',
    'DANG_SAN_XUAT': 'info',
    'IN_PROGRESS': 'info',
    'ORDER_COMPLETED': 'success',
    'COMPLETED': 'success',
    'HOAN_THANH': 'success',

    // ProductionStage statuses
    'PENDING': 'secondary',
    'WAITING': 'secondary',
    'READY': 'primary',
    'READY_TO_PRODUCE': 'success',
    'IN_PROGRESS': 'primary',
    'WAITING_QC': 'warning',
    'QC_IN_PROGRESS': 'warning',
    'QC_PASSED': 'success',
    'QC_FAILED': 'danger',
    'WAITING_REWORK': 'warning',
    'REWORK_IN_PROGRESS': 'info',
    'COMPLETED': 'success',
    'DANG_LAM': 'info',
    'PAUSED': 'danger',
    'WAITING_MATERIAL': 'warning',
  };
  return variantMap[status] || 'secondary';
};


// --- DIRECTOR ROLE MAPPERS ---
// --- DIRECTOR ROLE MAPPERS ---
export const getDirectorRfqStatus = (rfq) => {
  if (!rfq) return { label: 'Không xác định', variant: 'secondary', value: '' };

  // Logic:
  // - Nếu chưa có assignedSales -> Chờ phân công
  // - Nếu đã có assignedSales -> Đã phân công

  if (!rfq.assignedSales && !rfq.assignedSalesId) {
    return { label: 'Chờ phân công', variant: 'warning', value: 'WAITING_ASSIGNMENT' };
  } else {
    return { label: 'Đã phân công', variant: 'primary', value: 'ASSIGNED' };
  }
};

export const getDirectorContractStatus = (status) => {
  if (status === 'PENDING_APPROVAL') return { label: 'Chờ duyệt', variant: 'warning', value: 'PENDING_APPROVAL' };
  if (status === 'APPROVED') return { label: 'Đã duyệt', variant: 'success', value: 'APPROVED' };
  if (status === 'REJECTED') return { label: 'Đã từ chối', variant: 'danger', value: 'REJECTED' };

  const label = getStatusLabel(status);
  const variant = getStatusVariant(status);
  return { label, variant, value: status };
};

export const getDirectorPlanStatus = (status) => {
  if (status === 'PENDING_APPROVAL') return { label: 'Chờ duyệt', variant: 'warning', value: 'PENDING_APPROVAL' };
  if (status === 'APPROVED') return { label: 'Đã duyệt', variant: 'success', value: 'APPROVED' };
  if (status === 'REJECTED') return { label: 'Đã từ chối', variant: 'danger', value: 'REJECTED' };
  if (status === 'DRAFT') return { label: 'Nháp', variant: 'secondary', value: 'DRAFT' };
  if (status === 'SUPERSEDED') return { label: 'Đã thay thế', variant: 'dark', value: 'SUPERSEDED' };

  const label = getStatusLabel(status);
  const variant = getStatusVariant(status);
  return { label, variant, value: status };
};

// --- PLANNING ROLE MAPPERS ---
export const getPlanningRfqStatus = (rfq) => {
  if (!rfq) return { label: 'N/A', variant: 'secondary' };
  const status = rfq.status;

  if (status === 'DRAFT' || status === 'SENT' || status === 'PRELIMINARY_CHECKED' || status === 'FORWARDED_TO_PLANNING' || status === 'RECEIVED_BY_PLANNING') return { label: 'Chờ tạo', variant: 'warning', value: 'WAITING_CREATE' };
  if (status === 'QUOTED') return { label: 'Chờ xác nhận', variant: 'info', value: 'WAITING_CONFIRMATION' };
  // Gộp REJECTED và CANCELED thành "Đã từ chối"
  if (status === 'REJECTED' || status === 'CANCELED') return { label: 'Đã từ chối', variant: 'danger', value: 'REJECTED' };
  if (status === 'ACCEPTED' || status === 'ORDER_CREATED') return { label: 'Đã xác nhận', variant: 'success', value: 'CONFIRMED' };

  const label = getStatusLabel(status);
  const variant = getStatusVariant(status);
  return { label, variant, value: status };
};

export const getPlanningPlanStatus = (status) => {
  if (status === 'READY_FOR_PLANNING') return { label: 'Chờ tạo', variant: 'warning', value: 'READY_FOR_PLANNING' };
  if (status === 'DRAFT') return { label: 'Chờ gửi', variant: 'secondary', value: 'DRAFT' };
  if (status === 'PENDING_APPROVAL') return { label: 'Chờ duyệt', variant: 'info', value: 'PENDING_APPROVAL' };
  if (status === 'APPROVED') return { label: 'Đã duyệt', variant: 'success', value: 'APPROVED' };
  if (status === 'REJECTED') return { label: 'Đã từ chối', variant: 'danger', value: 'REJECTED' };

  const label = getStatusLabel(status);
  const variant = getStatusVariant(status);
  return { label, variant, value: status };
};

export const getProductionLotStatus = (status) => {
  if (status === 'FORMING') return { label: 'Đang gom đơn', variant: 'secondary', value: 'FORMING' };
  if (status === 'READY_FOR_PLANNING') return { label: 'Chờ tạo', variant: 'warning', value: 'READY_FOR_PLANNING' };
  if (status === 'PLANNING') return { label: 'Đang lập kế hoạch', variant: 'primary', value: 'PLANNING' };
  if (status === 'PLAN_APPROVED') return { label: 'Đã có kế hoạch', variant: 'success', value: 'PLAN_APPROVED' };
  if (status === 'IN_PRODUCTION') return { label: 'Đang sản xuất', variant: 'warning', value: 'IN_PRODUCTION' };
  if (status === 'COMPLETED') return { label: 'Hoàn thành', variant: 'success', value: 'COMPLETED' };
  if (status === 'CANCELED') return { label: 'Đã huỷ', variant: 'danger', value: 'CANCELED' };

  return { label: status || '—', variant: 'secondary', value: status };
};


// --- SALES ROLE MAPPERS ---
export const getSalesRfqStatus = (status) => {
  if (status === 'DRAFT' || status === 'SENT') return { label: 'Chờ xác nhận', variant: 'info', value: 'WAITING_CONFIRMATION' };
  if (status === 'PRELIMINARY_CHECKED' || status === 'FORWARDED_TO_PLANNING' || status === 'RECEIVED_BY_PLANNING') return { label: 'Đã xác nhận', variant: 'primary', value: 'CONFIRMED' };
  if (status === 'QUOTED') return { label: 'Đã báo giá', variant: 'success', value: 'QUOTED' };
  if (status === 'CANCELED') return { label: 'Đã hủy', variant: 'dark', value: 'CANCELED' };

  const label = getStatusLabel(status);
  const variant = getStatusVariant(status);
  return { label, variant, value: status };
};

export const getSalesQuoteStatus = (status, quote) => {
  if (status === 'DRAFT') {
    // Check if created by Planning (checking role object or direct roleName)
    const creatorRole = quote?.creator?.role?.name || quote?.creator?.roleName || '';
    const roleName = creatorRole.toUpperCase();
    const isPlanning = roleName.includes('PLANNING') || roleName === 'PLANNER';
    if (isPlanning) {
      return { label: 'Đã nhận', variant: 'warning', value: 'RECEIVED' };
    }
    return { label: 'Chờ báo giá', variant: 'secondary', value: 'WAITING_QUOTE' };
  }
  if (status === 'SENT') return { label: 'Chờ phê duyệt', variant: 'info', value: 'SENT' };
  if (status === 'ACCEPTED' || status === 'ORDER_CREATED') return { label: 'Đã duyệt', variant: 'success', value: 'ACCEPTED' };
  if (status === 'REJECTED') return { label: 'Từ chối', variant: 'danger', value: 'REJECTED' };
  const label = getStatusLabel(status);
  const variant = getStatusVariant(status);
  return { label, variant, value: status };
};

export const getSalesOrderStatus = (status) => {
  if (status === 'DRAFT' || status === 'PENDING_UPLOAD') return { label: 'Chờ ký hợp đồng', variant: 'secondary', value: 'WAITING_SIGNATURE' };
  if (status === 'PENDING_APPROVAL') return { label: 'Chờ phê duyệt hợp đồng đã ký', variant: 'warning', value: 'PENDING_APPROVAL' };
  if (status === 'REJECTED') return { label: 'Hợp đồng đã ký bị từ chối', variant: 'danger', value: 'REJECTED' };
  if (status === 'APPROVED') return { label: 'Hợp đồng đã ký được phê duyệt', variant: 'success', value: 'APPROVED' };
  if (status === 'WAITING_PRODUCTION' || status === 'IN_PROGRESS') return { label: 'Đang sản xuất', variant: 'info', value: 'IN_PRODUCTION' };
  if (status === 'COMPLETED') return { label: 'Sản xuất xong', variant: 'success', value: 'COMPLETED' };

  const label = getStatusLabel(status);
  const variant = getStatusVariant(status);
  return { label, variant, value: status };
};


// --- CUSTOMER ROLE MAPPERS ---
export const getCustomerRfqStatus = (status) => {
  if (status === 'DRAFT') return { label: 'Chờ xác nhận', variant: 'secondary', value: 'DRAFT' };
  if (status === 'SENT') return { label: 'Chờ xác nhận', variant: 'info', value: 'SENT' };

  // Các trạng thái đang xử lý nội bộ -> Khách hàng thấy là "Đã xác nhận"
  if (status === 'PRELIMINARY_CHECKED') return { label: 'Đã xác nhận', variant: 'primary', value: 'PRELIMINARY_CHECKED' };
  if (status === 'FORWARDED_TO_PLANNING') return { label: 'Đã xác nhận', variant: 'primary', value: 'FORWARDED_TO_PLANNING' };
  if (status === 'RECEIVED_BY_PLANNING') return { label: 'Đã xác nhận', variant: 'primary', value: 'RECEIVED_BY_PLANNING' };

  if (status === 'QUOTED') return { label: 'Chờ phê duyệt báo giá', variant: 'warning', value: 'QUOTED' };
  if (status === 'CANCELED') return { label: 'Đã hủy', variant: 'dark', value: 'CANCELED' };

  const label = getStatusLabel(status);
  const variant = getStatusVariant(status);
  return { label, variant, value: status };
};

export const getCustomerQuoteStatus = (status) => {
  if (status === 'DRAFT') return { label: 'Chờ báo giá', variant: 'secondary', value: 'DRAFT' };
  if (status === 'SENT') return { label: 'Chờ phê duyệt', variant: 'warning', value: 'SENT' };
  if (status === 'ACCEPTED' || status === 'ORDER_CREATED') return { label: 'Đã phê duyệt', variant: 'success', value: 'ACCEPTED' };
  if (status === 'REJECTED' || status === 'EXPIRED' || status === 'CANCELED') return { label: 'Đã từ chối', variant: 'danger', value: 'REJECTED' };

  const label = getStatusLabel(status);
  const variant = getStatusVariant(status);
  return { label, variant, value: status };
};

export const getCustomerOrderStatus = (status) => {
  if (status === 'DRAFT' || status === 'PENDING_UPLOAD') return { label: 'Chờ ký hợp đồng', variant: 'warning', value: 'WAITING_SIGNATURE' };
  if (status === 'PENDING_APPROVAL' || status === 'APPROVED') return { label: 'Chờ sản xuất', variant: 'primary', value: 'PENDING_PROCESS' };
  if (status === 'WAITING_PRODUCTION' || status === 'IN_PROGRESS') return { label: 'Đang sản xuất', variant: 'info', value: 'IN_PRODUCTION' };
  if (status === 'COMPLETED' || status === 'ORDER_COMPLETED') return { label: 'Sản xuất xong', variant: 'success', value: 'COMPLETED' };
  if (status === 'REJECTED') return { label: 'Đã từ chối', variant: 'danger', value: 'REJECTED' };

  const label = getStatusLabel(status);
  const variant = getStatusVariant(status);
  return { label, variant, value: status };
};
