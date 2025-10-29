package tmmsystem.dto.system;

import lombok.Getter; import lombok.Setter;

import java.time.Instant;

@Getter @Setter
public class NotificationDto {
    private Long id;
    private Long userId;
    private String type;
    private String category;
    private String title;
    private String message;
    private String referenceType;
    private Long referenceId;
    private Boolean isRead;
    private Instant readAt;
    private Instant createdAt;
}


