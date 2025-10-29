package tmmsystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tmmsystem.entity.WorkOrder;

import java.util.List;

public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {
    boolean existsByWoNumber(String woNumber);
    List<WorkOrder> findByProductionOrderId(Long productionOrderId);
}


