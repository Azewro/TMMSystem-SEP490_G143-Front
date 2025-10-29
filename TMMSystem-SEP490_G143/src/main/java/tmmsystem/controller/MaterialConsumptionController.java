package tmmsystem.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;
import tmmsystem.service.MaterialConsumptionService;
import tmmsystem.service.MaterialConsumptionService.MaterialConsumptionResult;
import tmmsystem.service.MaterialConsumptionService.MaterialAvailabilityResult;

@RestController
@RequestMapping("/v1/material-consumption")
@Validated
@Tag(name = "Tính toán Nguyên vật liệu & Lập kế hoạch", description = "API tính toán tiêu hao nguyên vật liệu và kiểm tra khả dụng dựa trên BOM")
public class MaterialConsumptionController {

    private final MaterialConsumptionService materialConsumptionService;

    public MaterialConsumptionController(MaterialConsumptionService materialConsumptionService) {
        this.materialConsumptionService = materialConsumptionService;
    }

    @Operation(summary = "Tính toán tiêu hao nguyên vật liệu cho kế hoạch sản xuất",
               description = "Tính toán chi tiết tiêu hao nguyên vật liệu dựa trên BOM (Bill of Materials) cho một kế hoạch sản xuất. Bao gồm tính toán hao hụt mặc định 10%")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Thành công - Đã tính toán tiêu hao nguyên vật liệu",
                    content = @io.swagger.v3.oas.annotations.media.Content(
                        mediaType = "application/json",
                        examples = @io.swagger.v3.oas.annotations.media.ExampleObject(value = """
                            {
                              "planId": 1,
                              "planCode": "PP-2025-001",
                              "totalProducts": 2,
                              "wastePercentage": 0.10,
                              "totalMaterialValue": 5000000.0,
                              "totalBasicQuantity": 200.0,
                              "totalWasteAmount": 20.0,
                              "productConsumptions": [
                                {
                                  "productName": "Khăn mặt Bamboo",
                                  "plannedQuantity": 1000,
                                  "materialDetails": [
                                    {
                                      "materialName": "Sợi Bamboo",
                                      "materialCode": "BAM-001",
                                      "unit": "kg",
                                      "basicQuantityRequired": 100.0,
                                      "wasteAmount": 10.0,
                                      "totalQuantityRequired": 110.0,
                                      "unitPrice": 50000.0,
                                      "totalValue": 5500000.0
                                    }
                                  ]
                                }
                              ],
                              "materialSummaries": [
                                {
                                  "materialName": "Sợi Bamboo",
                                  "materialCode": "BAM-001",
                                  "unit": "kg",
                                  "totalBasicQuantity": 200.0,
                                  "totalWasteAmount": 20.0,
                                  "totalQuantityRequired": 220.0,
                                  "unitPrice": 50000.0,
                                  "totalValue": 11000000.0
                                }
                              ]
                            }
                            """)
                    )),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy kế hoạch sản xuất"),
        @ApiResponse(responseCode = "500", description = "Lỗi server nội bộ")
    })
    @GetMapping("/production-plan/{planId}")
    public MaterialConsumptionResult calculateMaterialConsumption(
            @Parameter(description = "ID của kế hoạch sản xuất", required = true, example = "1")
            @PathVariable Long planId) {
        return materialConsumptionService.calculateMaterialConsumption(planId);
    }

    @Operation(summary = "Tính toán tiêu hao nguyên vật liệu với tỷ lệ hao hụt tùy chỉnh",
               description = "Tính toán tiêu hao nguyên vật liệu với tỷ lệ hao hụt tùy chỉnh cho kế hoạch sản xuất. Cho phép điều chỉnh tỷ lệ hao hụt từ 0% đến 50%")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Thành công - Đã tính toán tiêu hao nguyên vật liệu với hao hụt tùy chỉnh",
                    content = @io.swagger.v3.oas.annotations.media.Content(
                        mediaType = "application/json",
                        examples = @io.swagger.v3.oas.annotations.media.ExampleObject(value = """
                            {
                              "planId": 1,
                              "planCode": "PP-2025-001",
                              "totalProducts": 2,
                              "wastePercentage": 0.15,
                              "totalMaterialValue": 5750000.0,
                              "totalBasicQuantity": 200.0,
                              "totalWasteAmount": 30.0,
                              "message": "Tính toán với tỷ lệ hao hụt 15%"
                            }
                            """)
                    )),
        @ApiResponse(responseCode = "400", description = "Tỷ lệ hao hụt không hợp lệ (phải từ 0% đến 50%)"),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy kế hoạch sản xuất"),
        @ApiResponse(responseCode = "500", description = "Lỗi server nội bộ")
    })
    @GetMapping("/production-plan/{planId}/with-waste")
    public MaterialConsumptionResult calculateMaterialConsumptionWithWaste(
            @Parameter(description = "ID của kế hoạch sản xuất", required = true, example = "1")
            @PathVariable Long planId,
            @Parameter(description = "Tỷ lệ hao hụt (0.05 = 5%, 0.10 = 10%, 0.15 = 15%)", required = true, example = "0.15")
            @RequestParam java.math.BigDecimal wastePercentage) {
        return materialConsumptionService.calculateMaterialConsumption(planId, wastePercentage);
    }

    @Operation(summary = "Check material availability for production plan",
               description = "Check if all required materials are available for a production plan")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully checked material availability"),
        @ApiResponse(responseCode = "404", description = "Production plan not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/production-plan/{planId}/availability")
    public MaterialAvailabilityResult checkMaterialAvailability(
            @Parameter(description = "ID of the production plan", required = true, example = "1")
            @PathVariable Long planId) {
        return materialConsumptionService.checkMaterialAvailability(planId);
    }

    @Operation(summary = "Create material requisition from production plan",
               description = "Automatically create material requisition based on production plan material consumption")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully created material requisition"),
        @ApiResponse(responseCode = "400", description = "Insufficient material availability"),
        @ApiResponse(responseCode = "404", description = "Production plan not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping("/production-plan/{planId}/create-requisition")
    public String createMaterialRequisitionFromPlan(
            @Parameter(description = "ID of the production plan", required = true, example = "1")
            @PathVariable Long planId,
            @Parameter(description = "ID of the user creating the requisition", required = true, example = "1")
            @RequestParam Long createdById) {
        
        try {
            materialConsumptionService.createMaterialRequisitionFromPlan(planId, createdById);
            return "Material requisition created successfully for production plan: " + planId;
        } catch (Exception e) {
            return "Error creating material requisition: " + e.getMessage();
        }
    }
}
