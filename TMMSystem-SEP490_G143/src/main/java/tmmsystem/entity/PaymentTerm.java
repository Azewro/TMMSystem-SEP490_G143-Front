package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity @Table(name = "payment_term",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"contract_id", "term_sequence"})
        },
        indexes = {
                @Index(name = "idx_payment_term_contract_sequence", columnList = "contract_id, term_sequence", unique = true)
        }
)
@Getter @Setter
public class PaymentTerm {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contract_id")
    private Contract contract;

    @Column(name = "term_sequence", nullable = false)
    private Integer termSequence; // 1=Deposit, 2=Progress, 3=Final

    @Column(name = "term_name", nullable = false, length = 100)
    private String termName; // e.g., 30% Deposit

    @Column(name = "percentage", precision = 5, scale = 2, nullable = false)
    private BigDecimal percentage; // e.g., 30.00

    @Column(name = "amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal amount; // contract.total_amount * percentage / 100

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}


