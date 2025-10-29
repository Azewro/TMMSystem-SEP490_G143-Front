package tmmsystem.mapper;

import org.springframework.stereotype.Component;
import tmmsystem.dto.ProductCategoryDto;
import tmmsystem.entity.ProductCategory;

@Component
public class ProductCategoryMapper {
    public ProductCategoryDto toDto(ProductCategory e) {
        if (e == null) return null;
        ProductCategoryDto dto = new ProductCategoryDto();
        dto.setId(e.getId());
        dto.setName(e.getName());
        dto.setDescription(e.getDescription());
        dto.setParentId(e.getParent() != null ? e.getParent().getId() : null);
        dto.setDisplayOrder(e.getDisplayOrder());
        dto.setIsActive(e.getActive());
        dto.setCreatedAt(e.getCreatedAt());
        dto.setUpdatedAt(e.getUpdatedAt());
        return dto;
    }

    public ProductCategory toEntity(ProductCategoryDto dto) {
        if (dto == null) return null;
        ProductCategory e = new ProductCategory();
        e.setId(dto.getId());
        e.setName(dto.getName());
        e.setDescription(dto.getDescription());
        // parent relation should be set in service if needed
        e.setDisplayOrder(dto.getDisplayOrder());
        e.setActive(dto.getIsActive());
        return e;
    }
}


