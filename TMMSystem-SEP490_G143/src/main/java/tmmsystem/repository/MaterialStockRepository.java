package tmmsystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tmmsystem.entity.MaterialStock;

import java.util.List;

public interface MaterialStockRepository extends JpaRepository<MaterialStock, Long> {
    List<MaterialStock> findByMaterialId(Long materialId);
    List<MaterialStock> findByMaterialIdAndLocation(Long materialId, String location);
}