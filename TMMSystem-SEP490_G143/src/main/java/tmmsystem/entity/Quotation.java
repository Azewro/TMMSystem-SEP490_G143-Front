package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity @Table(name = "quotation",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"quotation_number"})
        },
        indexes = {
                @Index(name = "idx_quotation_customer_created", columnList = "customer_id, created_at"),
                @Index(name = "idx_quotation_status_canceled", columnList = "status, is_canceled")
        }
)
@Getter @Setter
public class Quotation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "quotation_number", nullable = false, length = 50)
    private String quotationNumber; // QUO-YYYYMMDD-XXX

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rfq_id")
    private Rfq rfq; // nullable when direct quotation

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(name = "valid_until", nullable = false)
    private LocalDate validUntil; // expiry date

    @Column(name = "total_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal totalAmount;

    @Column(length = 20)
    private String status = "DRAFT"; // DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED, CANCELED

    @Column(name = "is_accepted")
    private Boolean accepted = false;

    @Column(name = "is_canceled")
    private Boolean canceled = false;

    // Capacity check (Planning Department)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "capacity_checked_by")
    private User capacityCheckedBy;

    @Column(name = "capacity_checked_at")
    private Instant capacityCheckedAt;

    @Column(name = "capacity_check_notes", columnDefinition = "text")
    private String capacityCheckNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy; // Sales or Planning

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @OneToMany(mappedBy = "quotation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<QuotationDetail> details = new ArrayList<>();
}


