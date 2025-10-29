package tmmsystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tmmsystem.entity.PaymentTerm;

import java.util.List;

public interface PaymentTermRepository extends JpaRepository<PaymentTerm, Long> {
    List<PaymentTerm> findByContractIdOrderByTermSequenceAsc(Long contractId);
    boolean existsByContractIdAndTermSequence(Long contractId, Integer termSequence);
}


