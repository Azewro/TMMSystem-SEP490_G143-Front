package tmmsystem.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter @Setter
public class CustomerDto {
    private Long id;
    private String companyName;
    private String taxCode;
    private String businessLicense;
    private String address;
    private String contactPerson;
    private String email;
    private String phoneNumber;
    private String position;
    private String additionalContacts; // JSON string
    private String customerType;
    private String industry;
    private java.math.BigDecimal creditLimit;
    private String paymentTerms;
    private Boolean isActive;
    private Boolean isVerified;
    private String registrationType;
    private Long createdById;
    private java.time.Instant lastLoginAt;
    private Instant createdAt;
    private Instant updatedAt;
}


