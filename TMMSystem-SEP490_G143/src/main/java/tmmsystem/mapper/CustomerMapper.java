package tmmsystem.mapper;

import org.springframework.stereotype.Component;
import tmmsystem.dto.CustomerDto;
import tmmsystem.entity.Customer;

@Component
public class CustomerMapper {
    public CustomerDto toDto(Customer c) {
        if (c == null) return null;
        CustomerDto dto = new CustomerDto();
        dto.setId(c.getId());
        dto.setCompanyName(c.getCompanyName());
        dto.setTaxCode(c.getTaxCode());
        dto.setBusinessLicense(c.getBusinessLicense());
        dto.setAddress(c.getAddress());
        dto.setContactPerson(c.getContactPerson());
        dto.setEmail(c.getEmail());
        dto.setPhoneNumber(c.getPhoneNumber());
        dto.setPosition(c.getPosition());
        dto.setAdditionalContacts(c.getAdditionalContacts());
        dto.setCustomerType(c.getCustomerType());
        dto.setIndustry(c.getIndustry());
        dto.setCreditLimit(c.getCreditLimit());
        dto.setPaymentTerms(c.getPaymentTerms());
        dto.setIsActive(c.getActive());
        dto.setIsVerified(c.getVerified());
        dto.setRegistrationType(c.getRegistrationType());
        dto.setCreatedById(c.getCreatedBy() != null ? c.getCreatedBy().getId() : null);
        dto.setLastLoginAt(c.getLastLoginAt());
        dto.setCreatedAt(c.getCreatedAt());
        dto.setUpdatedAt(c.getUpdatedAt());
        return dto;
    }

    public Customer toEntity(CustomerDto dto) {
        if (dto == null) return null;
        Customer c = new Customer();
        c.setId(dto.getId());
        c.setCompanyName(dto.getCompanyName());
        c.setTaxCode(dto.getTaxCode());
        c.setBusinessLicense(dto.getBusinessLicense());
        c.setAddress(dto.getAddress());
        c.setContactPerson(dto.getContactPerson());
        c.setEmail(dto.getEmail());
        c.setPhoneNumber(dto.getPhoneNumber());
        c.setPosition(dto.getPosition());
        c.setAdditionalContacts(dto.getAdditionalContacts());
        c.setCustomerType(dto.getCustomerType());
        c.setIndustry(dto.getIndustry());
        c.setCreditLimit(dto.getCreditLimit());
        c.setPaymentTerms(dto.getPaymentTerms());
        c.setActive(dto.getIsActive());
        c.setVerified(dto.getIsVerified());
        c.setRegistrationType(dto.getRegistrationType());
        return c;
    }
}


