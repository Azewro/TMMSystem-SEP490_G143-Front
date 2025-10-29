package tmmsystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tmmsystem.entity.MaterialRequisitionDetail;

import java.util.List;

public interface MaterialRequisitionDetailRepository extends JpaRepository<MaterialRequisitionDetail, Long> {
    List<MaterialRequisitionDetail> findByRequisitionId(Long requisitionId);
}