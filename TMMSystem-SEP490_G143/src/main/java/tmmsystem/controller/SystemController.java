package tmmsystem.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import org.springframework.web.bind.annotation.*;
import tmmsystem.dto.system.*;
import tmmsystem.entity.*;
import tmmsystem.mapper.SystemMapper;
import tmmsystem.service.SystemService;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/v1/system")
public class SystemController {
    private final SystemService service;
    private final SystemMapper mapper;

    public SystemController(SystemService service, SystemMapper mapper) { this.service = service; this.mapper = mapper; }

    // Notifications
    @GetMapping("/users/{userId}/notifications")
    public List<NotificationDto> listNotifications(@PathVariable Long userId) { return service.listNotifications(userId).stream().map(mapper::toDto).collect(Collectors.toList()); }
    @GetMapping("/notifications/{id}")
    public NotificationDto getNotification(@PathVariable Long id) { return mapper.toDto(service.getNotification(id)); }
    @Operation(summary = "Tạo notification")
    @PostMapping("/notifications")
    public NotificationDto createNotification(
            @RequestBody(description = "Payload notification", required = true,
                    content = @Content(schema = @Schema(implementation = NotificationDto.class)))
            @org.springframework.web.bind.annotation.RequestBody NotificationDto body) {
        Notification n = new Notification();
        if (body.getUserId() != null) { User u = new User(); u.setId(body.getUserId()); n.setUser(u); }
        n.setType(body.getType()); n.setCategory(body.getCategory()); n.setTitle(body.getTitle()); n.setMessage(body.getMessage()); n.setReferenceType(body.getReferenceType()); n.setReferenceId(body.getReferenceId());
        return mapper.toDto(service.createNotification(n));
    }
    @PostMapping("/notifications/{id}/read")
    public NotificationDto markRead(@PathVariable Long id, @RequestParam(required = false) Instant readAt) { return mapper.toDto(service.markRead(id, readAt != null ? readAt : Instant.now())); }
    @DeleteMapping("/notifications/{id}")
    public void deleteNotification(@PathVariable Long id) { service.deleteNotification(id); }

    // Report templates
    @GetMapping("/report-templates")
    public List<ReportTemplateDto> listReportTemplates() { return service.listReportTemplates().stream().map(mapper::toDto).collect(Collectors.toList()); }
    @GetMapping("/report-templates/{id}")
    public ReportTemplateDto getReportTemplate(@PathVariable Long id) { return mapper.toDto(service.getReportTemplate(id)); }
    @Operation(summary = "Tạo report template")
    @PostMapping("/report-templates")
    public ReportTemplateDto createReportTemplate(
            @RequestBody(description = "Payload report template", required = true,
                    content = @Content(schema = @Schema(implementation = ReportTemplateDto.class)))
            @org.springframework.web.bind.annotation.RequestBody ReportTemplateDto body) {
        ReportTemplate r = new ReportTemplate();
        r.setTemplateName(body.getTemplateName()); r.setReportType(body.getReportType()); r.setDescription(body.getDescription()); r.setSqlQuery(body.getSqlQuery()); r.setParameters(body.getParameters()); r.setChartConfig(body.getChartConfig()); r.setActive(body.getIsActive());
        if (body.getCreatedById() != null) { User u = new User(); u.setId(body.getCreatedById()); r.setCreatedBy(u); }
        return mapper.toDto(service.createReportTemplate(r));
    }
    @PutMapping("/report-templates/{id}")
    public ReportTemplateDto updateReportTemplate(@PathVariable Long id, @RequestBody ReportTemplateDto body) {
        ReportTemplate r = new ReportTemplate();
        r.setTemplateName(body.getTemplateName()); r.setReportType(body.getReportType()); r.setDescription(body.getDescription()); r.setSqlQuery(body.getSqlQuery()); r.setParameters(body.getParameters()); r.setChartConfig(body.getChartConfig()); r.setActive(body.getIsActive());
        if (body.getCreatedById() != null) { User u = new User(); u.setId(body.getCreatedById()); r.setCreatedBy(u); }
        return mapper.toDto(service.updateReportTemplate(id, r));
    }
    @DeleteMapping("/report-templates/{id}")
    public void deleteReportTemplate(@PathVariable Long id) { service.deleteReportTemplate(id); }

    // Audit logs
    @GetMapping("/audit-logs")
    public List<AuditLogDto> listAuditLogs() { return service.listAuditLogs().stream().map(mapper::toDto).collect(Collectors.toList()); }
    @GetMapping("/audit-logs/{id}")
    public AuditLogDto getAuditLog(@PathVariable Long id) { return mapper.toDto(service.getAuditLog(id)); }
    @Operation(summary = "Tạo audit log")
    @PostMapping("/audit-logs")
    public AuditLogDto createAuditLog(
            @RequestBody(description = "Payload audit log", required = true,
                    content = @Content(schema = @Schema(implementation = AuditLogDto.class)))
            @org.springframework.web.bind.annotation.RequestBody AuditLogDto body) {
        AuditLog a = new AuditLog();
        if (body.getUserId() != null) { User u = new User(); u.setId(body.getUserId()); a.setUser(u); }
        a.setAction(body.getAction()); a.setEntityType(body.getEntityType()); a.setEntityId(body.getEntityId()); a.setOldValue(body.getOldValue()); a.setNewValue(body.getNewValue()); a.setIpAddress(body.getIpAddress()); a.setUserAgent(body.getUserAgent());
        return mapper.toDto(service.createAuditLog(a));
    }
}


