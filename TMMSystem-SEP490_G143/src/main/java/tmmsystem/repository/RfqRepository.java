package tmmsystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tmmsystem.entity.Rfq;

public interface RfqRepository extends JpaRepository<Rfq, Long> {
    boolean existsByRfqNumber(String rfqNumber);
}


