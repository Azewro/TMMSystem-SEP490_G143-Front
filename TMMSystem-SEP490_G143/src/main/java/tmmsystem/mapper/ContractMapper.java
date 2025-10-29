package tmmsystem.mapper;

import org.springframework.stereotype.Component;
import tmmsystem.dto.sales.ContractDto;
import tmmsystem.entity.Contract;

@Component
public class ContractMapper {
    public ContractDto toDto(Contract c) {
        if (c == null) return null;
        ContractDto dto = new ContractDto();
        dto.setId(c.getId());
        dto.setContractNumber(c.getContractNumber());
        dto.setQuotationId(c.getQuotation() != null ? c.getQuotation().getId() : null);
        dto.setCustomerId(c.getCustomer() != null ? c.getCustomer().getId() : null);
        dto.setContractDate(c.getContractDate());
        dto.setDeliveryDate(c.getDeliveryDate());
        dto.setTotalAmount(c.getTotalAmount());
        dto.setFilePath(c.getFilePath());
        dto.setStatus(c.getStatus());
        dto.setDirectorApprovedById(c.getDirectorApprovedBy() != null ? c.getDirectorApprovedBy().getId() : null);
        dto.setDirectorApprovedAt(c.getDirectorApprovedAt());
        dto.setDirectorApprovalNotes(c.getDirectorApprovalNotes());
        dto.setCreatedById(c.getCreatedBy() != null ? c.getCreatedBy().getId() : null);
        dto.setApprovedById(c.getApprovedBy() != null ? c.getApprovedBy().getId() : null);
        dto.setCreatedAt(c.getCreatedAt());
        dto.setUpdatedAt(c.getUpdatedAt());
        return dto;
    }
}


