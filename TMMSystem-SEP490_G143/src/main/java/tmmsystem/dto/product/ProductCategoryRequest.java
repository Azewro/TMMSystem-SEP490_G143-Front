package tmmsystem.dto.product;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "ProductCategoryRequest")
public class ProductCategoryRequest {
    @NotBlank
    @Size(max = 100)
    @Schema(description = "Tên danh mục", example = "Bath Towels", requiredMode = Schema.RequiredMode.REQUIRED)
    private String name;

    @Schema(description = "Mô tả")
    private String description;

    @Schema(description = "Parent category ID", example = "1")
    private Long parentId;

    @Schema(description = "Thứ tự hiển thị", example = "0")
    private Integer displayOrder;

    @Schema(description = "Kích hoạt", example = "true")
    private Boolean active;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }
    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}


