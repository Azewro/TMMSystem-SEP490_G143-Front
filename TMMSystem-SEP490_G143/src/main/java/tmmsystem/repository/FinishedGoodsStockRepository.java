package tmmsystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tmmsystem.entity.FinishedGoodsStock;

import java.util.List;

public interface FinishedGoodsStockRepository extends JpaRepository<FinishedGoodsStock, Long> {
    List<FinishedGoodsStock> findByProductId(Long productId);
}


