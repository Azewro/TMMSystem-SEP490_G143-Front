package tmmsystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tmmsystem.entity.ProductionOrder;

import java.util.List;

public interface ProductionOrderRepository extends JpaRepository<ProductionOrder, Long> {
    boolean existsByPoNumber(String poNumber);
    List<ProductionOrder> findByContractId(Long contractId);
    List<ProductionOrder> findByStatus(String status);
}


