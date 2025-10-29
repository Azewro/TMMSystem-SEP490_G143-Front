package tmmsystem.dto.system;

import lombok.Getter; import lombok.Setter;

import java.time.Instant;

@Getter @Setter
public class AuditLogDto {
    private Long id;
    private Long userId;
    private String action;
    private String entityType;
    private Long entityId;
    private String oldValue;
    private String newValue;
    private String ipAddress;
    private String userAgent;
    private Instant createdAt;
}


