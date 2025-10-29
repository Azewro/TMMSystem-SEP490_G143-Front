package tmmsystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tmmsystem.entity.QcPhoto;

import java.util.List;

public interface QcPhotoRepository extends JpaRepository<QcPhoto, Long> {
    List<QcPhoto> findByQcInspectionId(Long qcInspectionId);
}


