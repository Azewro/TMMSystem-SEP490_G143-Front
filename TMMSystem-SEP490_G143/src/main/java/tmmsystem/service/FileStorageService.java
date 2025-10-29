package tmmsystem.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
@Slf4j
public class FileStorageService {
    
    @Value("${file.storage.path:/data}")
    private String storagePath;
    
    @Value("${app.base-url}")
    private String baseUrl;
    
    /**
     * Upload contract file to local storage
     */
    public String uploadContractFile(MultipartFile file, Long contractId) throws IOException {
        validateFile(file);
        
        // Create directory structure: /data/contracts/{contractId}/
        Path contractDir = Paths.get(storagePath, "contracts", contractId.toString());
        Files.createDirectories(contractDir);
        
        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String fileName = "contract_" + contractId + "_" + System.currentTimeMillis() + extension;
        
        // Save file
        Path filePath = contractDir.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        log.info("File uploaded successfully: {}", filePath);
        
        // Return relative path for database storage
        return "contracts/" + contractId + "/" + fileName;
    }
    
    /**
     * Get contract file URL
     */
    public String getContractFileUrl(Long contractId) {
        try {
            Path contractDir = Paths.get(storagePath, "contracts", contractId.toString());
            if (!Files.exists(contractDir)) {
                return null;
            }
            
            // Find the first file in the contract directory
            return Files.list(contractDir)
                    .filter(Files::isRegularFile)
                    .map(path -> baseUrl + "/api/files/" + path.getFileName().toString())
                    .findFirst()
                    .orElse(null);
        } catch (IOException e) {
            log.error("Error getting contract file URL for contract ID: {}", contractId, e);
            return null;
        }
    }
    
    /**
     * Download contract file
     */
    public byte[] downloadContractFile(Long contractId) throws IOException {
        Path contractDir = Paths.get(storagePath, "contracts", contractId.toString());
        if (!Files.exists(contractDir)) {
            throw new IOException("Contract directory not found");
        }
        
        // Find the first file in the contract directory
        Path filePath = Files.list(contractDir)
                .filter(Files::isRegularFile)
                .findFirst()
                .orElseThrow(() -> new IOException("Contract file not found"));
        
        return Files.readAllBytes(filePath);
    }
    
    /**
     * Get contract file name for download
     */
    public String getContractFileName(Long contractId) throws IOException {
        Path contractDir = Paths.get(storagePath, "contracts", contractId.toString());
        if (!Files.exists(contractDir)) {
            throw new IOException("Contract directory not found");
        }
        
        // Find the first file in the contract directory
        return Files.list(contractDir)
                .filter(Files::isRegularFile)
                .findFirst()
                .map(path -> path.getFileName().toString())
                .orElseThrow(() -> new IOException("Contract file not found"));
    }
    
    /**
     * Upload production order file
     */
    public String uploadProductionOrderFile(MultipartFile file, Long productionOrderId) throws IOException {
        validateFile(file);
        
        // Create directory structure: /data/production-orders/{productionOrderId}/
        Path poDir = Paths.get(storagePath, "production-orders", productionOrderId.toString());
        Files.createDirectories(poDir);
        
        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String fileName = "production_order_" + productionOrderId + "_" + System.currentTimeMillis() + extension;
        
        // Save file
        Path filePath = poDir.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        log.info("Production order file uploaded successfully: {}", filePath);
        
        // Return relative path for database storage
        return "production-orders/" + productionOrderId + "/" + fileName;
    }
    
    /**
     * Get production order file URL
     */
    public String getProductionOrderFileUrl(Long productionOrderId) {
        try {
            Path poDir = Paths.get(storagePath, "production-orders", productionOrderId.toString());
            if (!Files.exists(poDir)) {
                return null;
            }
            
            // Find the first file in the production order directory
            return Files.list(poDir)
                    .filter(Files::isRegularFile)
                    .map(path -> baseUrl + "/api/files/" + path.getFileName().toString())
                    .findFirst()
                    .orElse(null);
        } catch (IOException e) {
            log.error("Error getting production order file URL for PO ID: {}", productionOrderId, e);
            return null;
        }
    }
    
    /**
     * Get file by filename (for API endpoint)
     */
    public byte[] getFileByFilename(String filename) throws IOException {
        // Search in all subdirectories
        Path storageDir = Paths.get(storagePath);
        if (!Files.exists(storageDir)) {
            throw new IOException("Storage directory not found");
        }
        
        return Files.walk(storageDir)
                .filter(Files::isRegularFile)
                .filter(path -> path.getFileName().toString().equals(filename))
                .findFirst()
                .map(path -> {
                    try {
                        return Files.readAllBytes(path);
                    } catch (IOException e) {
                        log.error("Error reading file: {}", path, e);
                        return null;
                    }
                })
                .orElseThrow(() -> new IOException("File not found: " + filename));
    }
    
    /**
     * Validate uploaded file - Only allow image files
     */
    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        
        // Check file size (max 10MB)
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("File size exceeds 10MB limit");
        }
        
        // Check file type - Only allow image files
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed (JPG, PNG, GIF, BMP, WEBP)");
        }
    }
    
    /**
     * Get file extension
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }
}
