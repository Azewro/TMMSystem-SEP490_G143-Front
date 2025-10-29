package tmmsystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tmmsystem.entity.ProductionOrderDetail;

import java.util.List;

public interface ProductionOrderDetailRepository extends JpaRepository<ProductionOrderDetail, Long> {
    List<ProductionOrderDetail> findByProductionOrderId(Long productionOrderId);
}


