package tmmsystem.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tmmsystem.entity.*;
import tmmsystem.repository.*;

import java.util.List;

@Service
public class ProductService {
    private final ProductRepository productRepo;
    private final MaterialRepository materialRepo;
    private final BomRepository bomRepo;
    private final BomDetailRepository bomDetailRepo;

    public ProductService(ProductRepository productRepo, MaterialRepository materialRepo, BomRepository bomRepo, BomDetailRepository bomDetailRepo) {
        this.productRepo = productRepo; this.materialRepo = materialRepo; this.bomRepo = bomRepo; this.bomDetailRepo = bomDetailRepo;
    }

    // Product
    public List<Product> listProducts() { return productRepo.findAll(); }
    public Product getProduct(Long id) { return productRepo.findById(id).orElseThrow(); }
    @Transactional public Product createProduct(Product e) { return productRepo.save(e); }
    @Transactional public Product updateProduct(Long id, Product upd) { Product e = productRepo.findById(id).orElseThrow(); e.setCode(upd.getCode()); e.setName(upd.getName()); e.setDescription(upd.getDescription()); e.setCategory(upd.getCategory()); e.setUnit(upd.getUnit()); e.setStandardWeight(upd.getStandardWeight()); e.setStandardDimensions(upd.getStandardDimensions()); e.setBasePrice(upd.getBasePrice()); e.setActive(upd.getActive()); return e; }
    public void deleteProduct(Long id) { productRepo.deleteById(id); }

    // Material
    public List<Material> listMaterials() { return materialRepo.findAll(); }
    public Material getMaterial(Long id) { return materialRepo.findById(id).orElseThrow(); }
    @Transactional public Material createMaterial(Material e) { return materialRepo.save(e); }
    @Transactional public Material updateMaterial(Long id, Material upd) { Material e = materialRepo.findById(id).orElseThrow(); e.setCode(upd.getCode()); e.setName(upd.getName()); e.setType(upd.getType()); e.setUnit(upd.getUnit()); e.setReorderPoint(upd.getReorderPoint()); e.setStandardCost(upd.getStandardCost()); e.setActive(upd.getActive()); return e; }
    public void deleteMaterial(Long id) { materialRepo.deleteById(id); }

    // BOM
    public List<Bom> listBomsByProduct(Long productId) { return bomRepo.findByProductIdOrderByCreatedAtDesc(productId); }
    public Bom getBom(Long id) { return bomRepo.findById(id).orElseThrow(); }
    @Transactional public Bom createBom(Bom e) { return bomRepo.save(e); }
    @Transactional public Bom updateBom(Long id, Bom upd) { Bom e = bomRepo.findById(id).orElseThrow(); e.setProduct(upd.getProduct()); e.setVersion(upd.getVersion()); e.setVersionNotes(upd.getVersionNotes()); e.setActive(upd.getActive()); e.setEffectiveDate(upd.getEffectiveDate()); e.setObsoleteDate(upd.getObsoleteDate()); e.setCreatedBy(upd.getCreatedBy()); return e; }
    public void deleteBom(Long id) { bomRepo.deleteById(id); }

    // BOM Detail
    public List<BomDetail> listBomDetails(Long bomId) { return bomDetailRepo.findByBomId(bomId); }
    public BomDetail getBomDetail(Long id) { return bomDetailRepo.findById(id).orElseThrow(); }
    @Transactional public BomDetail createBomDetail(BomDetail e) { return bomDetailRepo.save(e); }
    @Transactional public BomDetail updateBomDetail(Long id, BomDetail upd) { BomDetail e = bomDetailRepo.findById(id).orElseThrow(); e.setBom(upd.getBom()); e.setMaterial(upd.getMaterial()); e.setQuantity(upd.getQuantity()); e.setUnit(upd.getUnit()); e.setStage(upd.getStage()); e.setOptional(upd.getOptional()); e.setNotes(upd.getNotes()); return e; }
    public void deleteBomDetail(Long id) { bomDetailRepo.deleteById(id); }
}


