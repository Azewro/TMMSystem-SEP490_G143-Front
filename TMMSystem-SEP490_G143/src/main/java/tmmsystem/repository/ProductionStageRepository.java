package tmmsystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tmmsystem.entity.ProductionStage;

import java.util.List;

public interface ProductionStageRepository extends JpaRepository<ProductionStage, Long> {
    List<ProductionStage> findByWorkOrderDetailIdOrderByStageSequenceAsc(Long workOrderDetailId);
}


