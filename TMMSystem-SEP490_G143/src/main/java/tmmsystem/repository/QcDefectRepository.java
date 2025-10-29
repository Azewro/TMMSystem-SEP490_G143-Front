package tmmsystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tmmsystem.entity.QcDefect;

import java.util.List;

public interface QcDefectRepository extends JpaRepository<QcDefect, Long> {
    List<QcDefect> findByQcInspectionId(Long qcInspectionId);
}


