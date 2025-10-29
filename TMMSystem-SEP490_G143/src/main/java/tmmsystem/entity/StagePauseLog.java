package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;

import java.time.Instant;

@Entity @Table(name = "stage_pause_log",
        indexes = { @Index(name = "idx_pause_stage_paused_at", columnList = "production_stage_id, paused_at") }
)
@Getter @Setter
public class StagePauseLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "production_stage_id")
    private ProductionStage productionStage;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "paused_by")
    private User pausedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resumed_by")
    private User resumedBy;

    @Column(name = "pause_reason", length = 30, nullable = false)
    private String pauseReason; // MACHINE_BREAKDOWN, MATERIAL_SHORTAGE, SHIFT_END, QUALITY_ISSUE

    @Column(name = "pause_notes", columnDefinition = "text")
    private String pauseNotes;

    @Column(name = "paused_at", nullable = false)
    private Instant pausedAt;

    @Column(name = "resumed_at")
    private Instant resumedAt;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;
}


