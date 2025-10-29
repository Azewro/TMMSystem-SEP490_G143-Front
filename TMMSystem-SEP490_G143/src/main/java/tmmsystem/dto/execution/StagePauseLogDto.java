package tmmsystem.dto.execution;

import lombok.Getter; import lombok.Setter;

import java.time.Instant;

@Getter @Setter
public class StagePauseLogDto {
    private Long id;
    private Long productionStageId;
    private Long pausedById;
    private Long resumedById;
    private String pauseReason;
    private String pauseNotes;
    private Instant pausedAt;
    private Instant resumedAt;
    private Integer durationMinutes;
}


