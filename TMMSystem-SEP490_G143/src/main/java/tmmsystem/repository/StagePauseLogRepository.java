package tmmsystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tmmsystem.entity.StagePauseLog;

import java.util.List;

public interface StagePauseLogRepository extends JpaRepository<StagePauseLog, Long> {
    List<StagePauseLog> findByProductionStageIdOrderByPausedAtDesc(Long productionStageId);
}


