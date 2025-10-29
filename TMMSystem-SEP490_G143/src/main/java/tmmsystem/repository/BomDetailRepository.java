package tmmsystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tmmsystem.entity.BomDetail;

import java.util.List;

public interface BomDetailRepository extends JpaRepository<BomDetail, Long> {
    List<BomDetail> findByBomId(Long bomId);
}


