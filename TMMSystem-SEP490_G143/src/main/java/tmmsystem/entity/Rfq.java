package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity @Table(name = "rfq",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"rfq_number"})
        },
        indexes = {
                @Index(name = "idx_rfq_customer_created", columnList = "customer_id, created_at"),
                @Index(name = "idx_rfq_status", columnList = "status")
        }
)
@Getter @Setter
public class Rfq {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "rfq_number", nullable = false, length = 50)
    private String rfqNumber; // RFQ-YYYYMMDD-XXX

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(name = "expected_delivery_date")
    private LocalDate expectedDeliveryDate;

    @Column(length = 100)
    private String status = "DRAFT"; // DRAFT, SENT, QUOTED, CANCELED

    @Column(name = "is_sent")
    private Boolean sent = false;

    @Column(columnDefinition = "text")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy; // Sales person

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @OneToMany(mappedBy = "rfq", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RfqDetail> details = new ArrayList<>();
}


