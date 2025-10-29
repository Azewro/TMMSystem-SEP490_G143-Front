package tmmsystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tmmsystem.entity.RfqDetail;

import java.util.List;

public interface RfqDetailRepository extends JpaRepository<RfqDetail, Long> {
    List<RfqDetail> findByRfqId(Long rfqId);
}


