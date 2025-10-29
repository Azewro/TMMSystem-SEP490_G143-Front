package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity @Table(name = "notification",
        indexes = {
                @Index(name = "idx_notification_user_read_time", columnList = "user_id, is_read, created_at"),
                @Index(name = "idx_notification_category_time", columnList = "category, created_at")
        }
)
@Getter @Setter
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(length = 20, nullable = false)
    private String type; // INFO, WARNING, ERROR, SUCCESS

    @Column(length = 20, nullable = false)
    private String category; // ORDER, PRODUCTION, QC, MAINTENANCE, PAYMENT, SYSTEM

    @Column(length = 255, nullable = false)
    private String title;

    @Column(columnDefinition = "text")
    private String message;

    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "is_read")
    private Boolean read = false;

    @Column(name = "read_at")
    private Instant readAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}


