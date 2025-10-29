package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity @Table(name = "customer",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"email"})
        }
)
@Getter @Setter
public class Customer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
    @Column(name = "company_name", nullable = true, length = 255)
    private String companyName;
    @Column(name = "tax_code", length = 50)
    private String taxCode;
    @Column(name = "business_license", length = 100)
    private String businessLicense;
    @Column(columnDefinition = "text")
    private String address;

    // Primary Contact
    @Column(name = "contact_person", length = 150)
    private String contactPerson;
    @Column(nullable = false, length = 150)
    private String email; // Login email for customer portal
    @Column(name = "phone_number", length = 30)
    private String phoneNumber;
    @Column(length = 100)
    private String position; // Manager, Buyer, Director, etc.

    // Portal Access
    @Column(length = 255)
    private String password; // BCrypt hashed - for customer portal login
    @Column(name = "is_verified")
    private Boolean verified = false; // Email verified?
    @Column(name = "last_login_at")
    private java.time.Instant lastLoginAt;
    @Column(name = "password_reset_token", length = 255)
    private String passwordResetToken;
    @Column(name = "password_reset_expires_at")
    private java.time.Instant passwordResetExpiresAt;

    // Additional contacts (JSON)
    @Column(name = "additional_contacts", columnDefinition = "json")
    private String additionalContacts;

    // Business Information
    @Column(name = "customer_type", length = 20)
    private String customerType = "B2B"; // B2B, B2C
    @Column(length = 100)
    private String industry; // Hotel, Hospital, Spa, Retail
    @Column(name = "credit_limit", precision = 15, scale = 2)
    private java.math.BigDecimal creditLimit = java.math.BigDecimal.ZERO;
    @Column(name = "payment_terms", length = 100)
    private String paymentTerms; // 30% deposit, 70% upon delivery

    // Status & registration
    @Column(name = "is_active")
    private Boolean active = true;
    @Column(name = "registration_type", length = 20)
    private String registrationType = "SALES_CREATED";

    // Audit
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;
}


