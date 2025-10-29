package tmmsystem.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tmmsystem.entity.*;
import tmmsystem.repository.*;

import java.util.List;

@Service
public class SystemService {
    private final NotificationRepository notificationRepo;
    private final ReportTemplateRepository reportRepo;
    private final AuditLogRepository auditRepo;

    public SystemService(NotificationRepository notificationRepo, ReportTemplateRepository reportRepo, AuditLogRepository auditRepo) {
        this.notificationRepo = notificationRepo; this.reportRepo = reportRepo; this.auditRepo = auditRepo;
    }

    // Notifications
    public List<Notification> listNotifications(Long userId) { return notificationRepo.findByUserIdOrderByCreatedAtDesc(userId); }
    public Notification getNotification(Long id) { return notificationRepo.findById(id).orElseThrow(); }
    @Transactional public Notification createNotification(Notification n) { return notificationRepo.save(n); }
    @Transactional public Notification markRead(Long id, java.time.Instant when) { Notification n = notificationRepo.findById(id).orElseThrow(); n.setRead(true); n.setReadAt(when); return n; }
    public void deleteNotification(Long id) { notificationRepo.deleteById(id); }

    // Reports
    public List<ReportTemplate> listReportTemplates() { return reportRepo.findAll(); }
    public ReportTemplate getReportTemplate(Long id) { return reportRepo.findById(id).orElseThrow(); }
    @Transactional public ReportTemplate createReportTemplate(ReportTemplate r) { return reportRepo.save(r); }
    @Transactional public ReportTemplate updateReportTemplate(Long id, ReportTemplate upd) { ReportTemplate r = reportRepo.findById(id).orElseThrow(); r.setTemplateName(upd.getTemplateName()); r.setReportType(upd.getReportType()); r.setDescription(upd.getDescription()); r.setSqlQuery(upd.getSqlQuery()); r.setParameters(upd.getParameters()); r.setChartConfig(upd.getChartConfig()); r.setActive(upd.getActive()); r.setCreatedBy(upd.getCreatedBy()); return r; }
    public void deleteReportTemplate(Long id) { reportRepo.deleteById(id); }

    // Audit
    public List<AuditLog> listAuditLogs() { return auditRepo.findAll(); }
    public AuditLog getAuditLog(Long id) { return auditRepo.findById(id).orElseThrow(); }
    @Transactional public AuditLog createAuditLog(AuditLog a) { return auditRepo.save(a); }
}


