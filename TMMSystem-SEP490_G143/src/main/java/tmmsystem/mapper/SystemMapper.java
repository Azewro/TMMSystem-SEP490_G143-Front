package tmmsystem.mapper;

import org.springframework.stereotype.Component;
import tmmsystem.dto.system.*;
import tmmsystem.entity.*;

@Component
public class SystemMapper {
    public NotificationDto toDto(Notification e) {
        if (e == null) return null;
        NotificationDto dto = new NotificationDto();
        dto.setId(e.getId());
        dto.setUserId(e.getUser() != null ? e.getUser().getId() : null);
        dto.setType(e.getType());
        dto.setCategory(e.getCategory());
        dto.setTitle(e.getTitle());
        dto.setMessage(e.getMessage());
        dto.setReferenceType(e.getReferenceType());
        dto.setReferenceId(e.getReferenceId());
        dto.setIsRead(e.getRead());
        dto.setReadAt(e.getReadAt());
        dto.setCreatedAt(e.getCreatedAt());
        return dto;
    }

    public ReportTemplateDto toDto(ReportTemplate e) {
        if (e == null) return null;
        ReportTemplateDto dto = new ReportTemplateDto();
        dto.setId(e.getId());
        dto.setTemplateName(e.getTemplateName());
        dto.setReportType(e.getReportType());
        dto.setDescription(e.getDescription());
        dto.setSqlQuery(e.getSqlQuery());
        dto.setParameters(e.getParameters());
        dto.setChartConfig(e.getChartConfig());
        dto.setIsActive(e.getActive());
        dto.setCreatedById(e.getCreatedBy() != null ? e.getCreatedBy().getId() : null);
        dto.setCreatedAt(e.getCreatedAt());
        dto.setUpdatedAt(e.getUpdatedAt());
        return dto;
    }

    public AuditLogDto toDto(AuditLog e) {
        if (e == null) return null;
        AuditLogDto dto = new AuditLogDto();
        dto.setId(e.getId());
        dto.setUserId(e.getUser() != null ? e.getUser().getId() : null);
        dto.setAction(e.getAction());
        dto.setEntityType(e.getEntityType());
        dto.setEntityId(e.getEntityId());
        dto.setOldValue(e.getOldValue());
        dto.setNewValue(e.getNewValue());
        dto.setIpAddress(e.getIpAddress());
        dto.setUserAgent(e.getUserAgent());
        dto.setCreatedAt(e.getCreatedAt());
        return dto;
    }
}


