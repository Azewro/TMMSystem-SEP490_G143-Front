package tmmsystem.dto.product;

import lombok.Getter; import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Getter @Setter
public class BomDto {
    private Long id;
    private Long productId;
    private String version;
    private String versionNotes;
    private Boolean isActive;
    private LocalDate effectiveDate;
    private LocalDate obsoleteDate;
    private Long createdById;
    private Instant createdAt;
    private Instant updatedAt;
    private List<BomDetailDto> details;
}


