package tmmsystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tmmsystem.entity.TechnicalSheet;

public interface TechnicalSheetRepository extends JpaRepository<TechnicalSheet, Long> {
    boolean existsBySheetNumber(String sheetNumber);
}


