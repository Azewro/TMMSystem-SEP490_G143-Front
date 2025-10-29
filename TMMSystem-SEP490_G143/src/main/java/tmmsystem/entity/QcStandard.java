package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity @Table(name = "qc_standard")
@Getter @Setter
public class QcStandard {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "standard_name", length = 255, nullable = false)
    private String standardName;

    @Column(name = "standard_code", length = 50)
    private String standardCode;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "applicable_stages", length = 255)
    private String applicableStages; // Comma-separated stages

    @Column(name = "is_active")
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}


