package tmmsystem.mapper;

import org.springframework.stereotype.Component;
import tmmsystem.dto.sales.PaymentDto;
import tmmsystem.dto.sales.PaymentTermDto;
import tmmsystem.entity.Payment;
import tmmsystem.entity.PaymentTerm;

@Component
public class PaymentMapper {
    public PaymentTermDto toDto(PaymentTerm t) {
        if (t == null) return null;
        PaymentTermDto dto = new PaymentTermDto();
        dto.setId(t.getId());
        dto.setContractId(t.getContract() != null ? t.getContract().getId() : null);
        dto.setTermSequence(t.getTermSequence());
        dto.setTermName(t.getTermName());
        dto.setPercentage(t.getPercentage());
        dto.setAmount(t.getAmount());
        dto.setDueDate(t.getDueDate());
        dto.setDescription(t.getDescription());
        dto.setCreatedAt(t.getCreatedAt());
        return dto;
    }

    public PaymentDto toDto(Payment p) {
        if (p == null) return null;
        PaymentDto dto = new PaymentDto();
        dto.setId(p.getId());
        dto.setContractId(p.getContract() != null ? p.getContract().getId() : null);
        dto.setPaymentTermId(p.getPaymentTerm() != null ? p.getPaymentTerm().getId() : null);
        dto.setPaymentType(p.getPaymentType());
        dto.setAmount(p.getAmount());
        dto.setPaymentDate(p.getPaymentDate());
        dto.setPaymentMethod(p.getPaymentMethod());
        dto.setPaymentReference(p.getPaymentReference());
        dto.setStatus(p.getStatus());
        dto.setInvoiceNumber(p.getInvoiceNumber());
        dto.setReceiptFilePath(p.getReceiptFilePath());
        dto.setNotes(p.getNotes());
        dto.setCreatedById(p.getCreatedBy() != null ? p.getCreatedBy().getId() : null);
        dto.setVerifiedById(p.getVerifiedBy() != null ? p.getVerifiedBy().getId() : null);
        dto.setVerifiedAt(p.getVerifiedAt());
        dto.setCreatedAt(p.getCreatedAt());
        dto.setUpdatedAt(p.getUpdatedAt());
        return dto;
    }
}


