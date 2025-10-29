package tmmsystem.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import tmmsystem.entity.Contract;
import tmmsystem.entity.User;
import tmmsystem.repository.ContractRepository;
import tmmsystem.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;
import java.util.List;
import java.util.ArrayList;
import org.springframework.beans.factory.annotation.Autowired;

@Service
@Slf4j
public class ContractService {
    private final ContractRepository repository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final FileStorageService fileStorageService;
    private final ProductionPlanService productionPlanService;

    @Autowired
    public ContractService(ContractRepository repository, 
                         UserRepository userRepository,
                         NotificationService notificationService,
                         FileStorageService fileStorageService,
                         ProductionPlanService productionPlanService) { 
        this.repository = repository; 
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.fileStorageService = fileStorageService;
        this.productionPlanService = productionPlanService;
    }

    public List<Contract> findAll() { return repository.findAll(); }
    public Contract findById(Long id) { return repository.findById(id).orElseThrow(); }

    @Transactional
    public Contract create(Contract c) { return repository.save(c); }

    @Transactional
    public Contract update(Long id, Contract updated) {
        Contract existing = repository.findById(id).orElseThrow();
        existing.setContractNumber(updated.getContractNumber());
        existing.setQuotation(updated.getQuotation());
        existing.setCustomer(updated.getCustomer());
        existing.setContractDate(updated.getContractDate());
        existing.setDeliveryDate(updated.getDeliveryDate());
        existing.setTotalAmount(updated.getTotalAmount());
        existing.setFilePath(updated.getFilePath());
        existing.setStatus(updated.getStatus());
        existing.setDirectorApprovedBy(updated.getDirectorApprovedBy());
        existing.setDirectorApprovedAt(updated.getDirectorApprovedAt());
        existing.setDirectorApprovalNotes(updated.getDirectorApprovalNotes());
        existing.setCreatedBy(updated.getCreatedBy());
        existing.setApprovedBy(updated.getApprovedBy());
        return existing;
    }

    public void delete(Long id) { repository.deleteById(id); }

    // ===== GIAI ĐOẠN 3: CONTRACT UPLOAD & APPROVAL =====
    
    @Transactional
    public Contract uploadSignedContract(Long contractId, MultipartFile file, String notes, Long saleUserId) {
        Contract contract = repository.findById(contractId)
            .orElseThrow(() -> new RuntimeException("Contract not found"));
        
        try {
            // Upload file to local storage
            String filePath = fileStorageService.uploadContractFile(file, contractId);
            
            // Update contract
            contract.setFilePath(filePath);
            contract.setStatus("PENDING_APPROVAL");
            contract.setUpdatedAt(Instant.now());
            
            Contract savedContract = repository.save(contract);
            
            // Send notification to Director
            notificationService.notifyContractUploaded(savedContract);
            
            return savedContract;
        } catch (Exception e) {
            log.error("Error uploading contract file", e);
            throw new RuntimeException("Failed to upload contract file: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    public Contract approveContract(Long contractId, Long directorId, String notes) {
        Contract contract = repository.findById(contractId)
            .orElseThrow(() -> new RuntimeException("Contract not found"));
        
        User director = userRepository.findById(directorId)
            .orElseThrow(() -> new RuntimeException("Director not found"));
        
        contract.setStatus("APPROVED");
        contract.setDirectorApprovedBy(director);
        contract.setDirectorApprovedAt(Instant.now());
        contract.setDirectorApprovalNotes(notes);
        contract.setUpdatedAt(Instant.now());
        
        Contract savedContract = repository.save(contract);
        
        // Automatically create Production Plan for approved contract
        try {
            createProductionPlanForContract(savedContract);
        } catch (Exception e) {
            log.error("Failed to create production plan for contract {}: {}", contractId, e.getMessage());
            // Don't fail the contract approval if production plan creation fails
            // Just log the error and continue
        }
        
        // Send notification to Planning Department
        notificationService.notifyContractApproved(savedContract);
        
        return savedContract;
    }
    
    @Transactional
    public Contract rejectContract(Long contractId, Long directorId, String rejectionNotes) {
        Contract contract = repository.findById(contractId)
            .orElseThrow(() -> new RuntimeException("Contract not found"));
        
        User director = userRepository.findById(directorId)
            .orElseThrow(() -> new RuntimeException("Director not found"));
        
        contract.setStatus("REJECTED");
        contract.setDirectorApprovedBy(director);
        contract.setDirectorApprovedAt(Instant.now());
        contract.setDirectorApprovalNotes(rejectionNotes);
        contract.setUpdatedAt(Instant.now());
        
        Contract savedContract = repository.save(contract);
        
        // Send notification to Sale Staff
        notificationService.notifyContractRejected(savedContract);
        
        return savedContract;
    }
    
    public List<Contract> getContractsPendingApproval() {
        return repository.findByStatus("PENDING_APPROVAL");
    }
    
    public List<Contract> getDirectorPendingContracts() {
        return repository.findByStatus("PENDING_APPROVAL");
    }
    
    public String getContractFileUrl(Long contractId) {
        try {
            return fileStorageService.getContractFileUrl(contractId);
        } catch (Exception e) {
            log.error("Error getting contract file URL for contract ID: {}", contractId, e);
            return null;
        }
    }
    
    public byte[] downloadContractFile(Long contractId) {
        try {
            return fileStorageService.downloadContractFile(contractId);
        } catch (Exception e) {
            log.error("Error downloading contract file for contract ID: {}", contractId, e);
            throw new RuntimeException("Failed to download contract file: " + e.getMessage(), e);
        }
    }
    
    public String getContractFileName(Long contractId) {
        try {
            return fileStorageService.getContractFileName(contractId);
        } catch (Exception e) {
            log.error("Error getting contract file name for contract ID: {}", contractId, e);
            throw new RuntimeException("Failed to get contract file name: " + e.getMessage(), e);
        }
    }
    
    // ===== ORDER DETAILS API =====
    
    public tmmsystem.dto.sales.OrderDetailsDto getOrderDetails(Long contractId) {
        Contract contract = repository.findById(contractId)
            .orElseThrow(() -> new RuntimeException("Contract not found"));
        
        // Build customer info
        tmmsystem.dto.sales.OrderDetailsDto.CustomerInfo customerInfo = tmmsystem.dto.sales.OrderDetailsDto.CustomerInfo.builder()
            .customerId(contract.getCustomer().getId())
            .customerName(contract.getCustomer().getContactPerson())
            .phoneNumber(contract.getCustomer().getPhoneNumber())
            .companyName(contract.getCustomer().getCompanyName())
            .taxCode(contract.getCustomer().getTaxCode())
            .address(contract.getCustomer().getAddress())
            .build();
        
        // Build order items from quotation details
        List<tmmsystem.dto.sales.OrderDetailsDto.OrderItemDto> orderItems = new ArrayList<>();
        if (contract.getQuotation() != null && contract.getQuotation().getDetails() != null) {
            for (tmmsystem.entity.QuotationDetail detail : contract.getQuotation().getDetails()) {
                tmmsystem.dto.sales.OrderDetailsDto.OrderItemDto item = tmmsystem.dto.sales.OrderDetailsDto.OrderItemDto.builder()
                    .productId(detail.getProduct().getId())
                    .productName(detail.getProduct().getName())
                    .productSize(detail.getProduct().getStandardDimensions()) // Using standardDimensions field
                    .quantity(detail.getQuantity())
                    .unit(detail.getUnit())
                    .unitPrice(detail.getUnitPrice())
                    .totalPrice(detail.getTotalPrice())
                    .noteColor(detail.getNoteColor())
                    .build();
                orderItems.add(item);
            }
        }
        
        return tmmsystem.dto.sales.OrderDetailsDto.builder()
            .contractId(contract.getId())
            .contractNumber(contract.getContractNumber())
            .status(contract.getStatus())
            .contractDate(contract.getContractDate())
            .deliveryDate(contract.getDeliveryDate())
            .totalAmount(contract.getTotalAmount())
            .filePath(contract.getFilePath())
            .customerInfo(customerInfo)
            .orderItems(orderItems)
            .build();
    }
    
    /**
     * Create a basic Production Plan for approved contract
     * This method creates a draft production plan that Planning Department can then customize
     */
    private void createProductionPlanForContract(Contract contract) {
        try {
            // Check if production plan already exists for this contract
            if (productionPlanService.findPlansByContract(contract.getId()).size() > 0) {
                log.info("Production plan already exists for contract {}", contract.getId());
                return;
            }
            
            // Create a basic production plan request
            tmmsystem.dto.production_plan.CreateProductionPlanRequest request = 
                new tmmsystem.dto.production_plan.CreateProductionPlanRequest();
            request.setContractId(contract.getId());
            request.setNotes("Auto-generated from approved contract: " + contract.getContractNumber());
            
            // Create basic plan details from quotation details
            if (contract.getQuotation() != null && contract.getQuotation().getDetails() != null) {
                List<tmmsystem.dto.production_plan.ProductionPlanDetailRequest> details = new ArrayList<>();
                
                for (tmmsystem.entity.QuotationDetail quotationDetail : contract.getQuotation().getDetails()) {
                    tmmsystem.dto.production_plan.ProductionPlanDetailRequest detailRequest = 
                        new tmmsystem.dto.production_plan.ProductionPlanDetailRequest();
                    
                    detailRequest.setProductId(quotationDetail.getProduct().getId());
                    detailRequest.setPlannedQuantity(quotationDetail.getQuantity());
                    detailRequest.setRequiredDeliveryDate(contract.getDeliveryDate());
                    
                    // Set proposed dates (can be adjusted by Planning Department)
                    detailRequest.setProposedStartDate(java.time.LocalDate.now().plusDays(7)); // Start in 1 week
                    detailRequest.setProposedEndDate(contract.getDeliveryDate().minusDays(3)); // End 3 days before delivery
                    
                    detailRequest.setNotes("Auto-generated from quotation detail");
                    
                    details.add(detailRequest);
                }
                
                request.setDetails(details);
            }
            
            // Create the production plan
            productionPlanService.createPlanFromContract(request);
            
            log.info("Successfully created production plan for contract {}", contract.getId());
            
        } catch (Exception e) {
            log.error("Error creating production plan for contract {}: {}", contract.getId(), e.getMessage(), e);
            throw e;
        }
    }
}


