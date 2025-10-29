package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity @Table(name = "report_template")
@Getter @Setter
public class ReportTemplate {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "template_name", length = 255, nullable = false)
    private String templateName;

    @Column(name = "report_type", length = 50, nullable = false)
    private String reportType; // PRODUCTION, QUALITY, INVENTORY, FINANCIAL

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "sql_query", columnDefinition = "text")
    private String sqlQuery;

    @Column(name = "parameters", columnDefinition = "json")
    private String parameters;

    @Column(name = "chart_config", columnDefinition = "json")
    private String chartConfig;

    @Column(name = "is_active")
    private Boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}


