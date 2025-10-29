package tmmsystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tmmsystem.entity.Bom;

import java.util.List;
import java.util.Optional;

public interface BomRepository extends JpaRepository<Bom, Long> {
    List<Bom> findByProductIdOrderByCreatedAtDesc(Long productId);
    boolean existsByProductIdAndVersion(Long productId, String version);
    Optional<Bom> findActiveBomByProductId(Long productId);
}


