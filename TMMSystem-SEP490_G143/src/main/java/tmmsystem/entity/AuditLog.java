package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity @Table(name = "audit_log",
        indexes = {
                @Index(name = "idx_audit_entity_time", columnList = "entity_type, entity_id, created_at"),
                @Index(name = "idx_audit_user_time", columnList = "user_id, created_at"),
                @Index(name = "idx_audit_action_time", columnList = "action, created_at")
        }
)
@Getter @Setter
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(length = 100, nullable = false)
    private String action; // CREATE, UPDATE, DELETE, LOGIN, APPROVE

    @Column(name = "entity_type", length = 50, nullable = false)
    private String entityType; // contract, production_order, payment, etc.

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "old_value", columnDefinition = "json")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "json")
    private String newValue;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "text")
    private String userAgent;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}


