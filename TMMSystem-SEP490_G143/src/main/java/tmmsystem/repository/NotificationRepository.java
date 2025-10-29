package tmmsystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tmmsystem.entity.Notification;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
}


