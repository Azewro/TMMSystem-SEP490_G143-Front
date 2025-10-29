package tmmsystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tmmsystem.entity.AuditLog;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
}


