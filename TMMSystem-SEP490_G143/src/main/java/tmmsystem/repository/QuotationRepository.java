package tmmsystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tmmsystem.entity.Quotation;

public interface QuotationRepository extends JpaRepository<Quotation, Long> {
    boolean existsByQuotationNumber(String quotationNumber);
}


