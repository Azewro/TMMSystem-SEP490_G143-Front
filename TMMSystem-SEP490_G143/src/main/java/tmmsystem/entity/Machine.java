package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity @Table(name = "machine")
@Getter @Setter
public class Machine {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
    @Column(nullable = false, unique = true, length = 50)
    private String code;
    @Column(nullable = false, length = 255)
    private String name;
    @Column(name = "type", nullable = false, length = 20)
    private String type; // WARPING, WEAVING, DYEING, CUTTING, HEMMING, PACKAGING
    @Column(name = "status", length = 20)
    private String status = "AVAILABLE"; // AVAILABLE, IN_USE, MAINTENANCE, BROKEN
    @Column(name = "location", length = 100)
    private String location; // Factory floor section
    @Column(name = "specifications", columnDefinition = "json")
    private String specifications; // JSON string
    @Column(name = "last_maintenance_at")
    private java.time.Instant lastMaintenanceAt;
    @Column(name = "next_maintenance_at")
    private java.time.Instant nextMaintenanceAt;
    @Column(name = "maintenance_interval_days")
    private Integer maintenanceIntervalDays = 90;
}


