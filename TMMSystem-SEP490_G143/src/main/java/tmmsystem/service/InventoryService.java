package tmmsystem.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tmmsystem.entity.*;
import tmmsystem.repository.*;

import java.util.List;

@Service
public class InventoryService {
    private final MaterialStockRepository matStockRepo;
    private final MaterialTransactionRepository matTxnRepo;
    private final FinishedGoodsStockRepository fgStockRepo;
    private final FinishedGoodsTransactionRepository fgTxnRepo;

    public InventoryService(MaterialStockRepository matStockRepo,
                            MaterialTransactionRepository matTxnRepo,
                            FinishedGoodsStockRepository fgStockRepo,
                            FinishedGoodsTransactionRepository fgTxnRepo) {
        this.matStockRepo = matStockRepo; this.matTxnRepo = matTxnRepo; this.fgStockRepo = fgStockRepo; this.fgTxnRepo = fgTxnRepo;
    }

    // Material Stock
    public List<MaterialStock> listMaterialStock(Long materialId) { return matStockRepo.findByMaterialId(materialId); }
    public MaterialStock getMaterialStock(Long id) { return matStockRepo.findById(id).orElseThrow(); }
    @Transactional public MaterialStock upsertMaterialStock(MaterialStock s) { return matStockRepo.save(s); }
    public void deleteMaterialStock(Long id) { matStockRepo.deleteById(id); }

    // Material Transactions
    public List<MaterialTransaction> listMaterialTxns(Long materialId) { return matTxnRepo.findByMaterialIdOrderByCreatedAtDesc(materialId); }
    public MaterialTransaction getMaterialTxn(Long id) { return matTxnRepo.findById(id).orElseThrow(); }
    @Transactional public MaterialTransaction createMaterialTxn(MaterialTransaction t) { return matTxnRepo.save(t); }

    // Finished Goods Stock
    public List<FinishedGoodsStock> listFgStock(Long productId) { return fgStockRepo.findByProductId(productId); }
    public FinishedGoodsStock getFgStock(Long id) { return fgStockRepo.findById(id).orElseThrow(); }
    @Transactional public FinishedGoodsStock upsertFgStock(FinishedGoodsStock s) { return fgStockRepo.save(s); }
    public void deleteFgStock(Long id) { fgStockRepo.deleteById(id); }

    // Finished Goods Transactions
    public List<FinishedGoodsTransaction> listFgTxns(Long productId) { return fgTxnRepo.findByProductIdOrderByCreatedAtDesc(productId); }
    public FinishedGoodsTransaction getFgTxn(Long id) { return fgTxnRepo.findById(id).orElseThrow(); }
    @Transactional public FinishedGoodsTransaction createFgTxn(FinishedGoodsTransaction t) { return fgTxnRepo.save(t); }
}


