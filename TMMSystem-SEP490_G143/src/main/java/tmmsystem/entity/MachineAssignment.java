package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity @Table(name = "machine_assignment",
        indexes = {
                @Index(name = "idx_machine_assignment_unique", columnList = "machine_id, production_stage_id", unique = true),
                @Index(name = "idx_machine_assignment_time", columnList = "machine_id, assigned_at")
        }
)
@Getter @Setter
public class MachineAssignment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "machine_id")
    private Machine machine;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "production_stage_id")
    private ProductionStage productionStage;

    @CreationTimestamp
    @Column(name = "assigned_at", updatable = false)
    private Instant assignedAt;

    @Column(name = "released_at")
    private Instant releasedAt;
}


