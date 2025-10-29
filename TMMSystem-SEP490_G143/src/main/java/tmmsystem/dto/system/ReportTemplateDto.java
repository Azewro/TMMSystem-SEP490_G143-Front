package tmmsystem.dto.system;

import lombok.Getter; import lombok.Setter;

import java.time.Instant;

@Getter @Setter
public class ReportTemplateDto {
    private Long id;
    private String templateName;
    private String reportType;
    private String description;
    private String sqlQuery;
    private String parameters;
    private String chartConfig;
    private Boolean isActive;
    private Long createdById;
    private Instant createdAt;
    private Instant updatedAt;
}


