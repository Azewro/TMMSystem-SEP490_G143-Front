package tmmsystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tmmsystem.entity.FinishedGoodsTransaction;

import java.util.List;

public interface FinishedGoodsTransactionRepository extends JpaRepository<FinishedGoodsTransaction, Long> {
    List<FinishedGoodsTransaction> findByProductIdOrderByCreatedAtDesc(Long productId);
}


