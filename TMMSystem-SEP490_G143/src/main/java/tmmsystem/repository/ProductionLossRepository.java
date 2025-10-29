package tmmsystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tmmsystem.entity.ProductionLoss;

import java.util.List;

public interface ProductionLossRepository extends JpaRepository<ProductionLoss, Long> {
    List<ProductionLoss> findByProductionOrderId(Long productionOrderId);
}


