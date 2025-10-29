-- Migration script for Production Plan tables
-- This script creates the new Production Plan tables and integrates them with existing workflow

-- Create production_plan table
CREATE TABLE production_plan (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    contract_id BIGINT NOT NULL,
    plan_code VARCHAR(50) NOT NULL UNIQUE,
    status ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED') DEFAULT 'DRAFT',
    created_by BIGINT NOT NULL,
    approved_by BIGINT NULL,
    approved_at DATETIME NULL,
    approval_notes TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (contract_id) REFERENCES contract(id),
    FOREIGN KEY (created_by) REFERENCES user(id),
    FOREIGN KEY (approved_by) REFERENCES user(id),
    
    INDEX idx_production_plan_contract (contract_id),
    INDEX idx_production_plan_status (status),
    INDEX idx_production_plan_created_by (created_by),
    INDEX idx_production_plan_approved_by (approved_by)
);

-- Create production_plan_detail table
CREATE TABLE production_plan_detail (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    plan_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    planned_quantity DECIMAL(12,2) NOT NULL,
    required_delivery_date DATE NOT NULL,
    proposed_start_date DATE NOT NULL,
    proposed_end_date DATE NOT NULL,
    work_center_id BIGINT NULL,
    expected_capacity_per_day DECIMAL(10,2) NULL,
    lead_time_days INT NULL,
    notes TEXT NULL,
    
    FOREIGN KEY (plan_id) REFERENCES production_plan(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(id),
    FOREIGN KEY (work_center_id) REFERENCES machine(id),
    
    INDEX idx_plan_detail_plan (plan_id),
    INDEX idx_plan_detail_product (product_id),
    INDEX idx_plan_detail_work_center (work_center_id),
    INDEX idx_plan_detail_delivery_date (required_delivery_date),
    UNIQUE KEY unique_plan_product (plan_id, product_id)
);

-- Create production_plan_stage table
CREATE TABLE production_plan_stage (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    plan_detail_id BIGINT NOT NULL,
    stage_type VARCHAR(20) NOT NULL,
    sequence_no INT NOT NULL,
    assigned_machine_id BIGINT NULL,
    in_charge_user_id BIGINT NULL,
    planned_start_time DATETIME NOT NULL,
    planned_end_time DATETIME NOT NULL,
    min_required_duration_minutes INT NULL,
    transfer_batch_quantity DECIMAL(10,2) NULL,
    capacity_per_hour DECIMAL(10,2) NULL,
    notes TEXT NULL,
    
    FOREIGN KEY (plan_detail_id) REFERENCES production_plan_detail(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_machine_id) REFERENCES machine(id),
    FOREIGN KEY (in_charge_user_id) REFERENCES user(id),
    
    INDEX idx_plan_stage_detail (plan_detail_id),
    INDEX idx_plan_stage_type (stage_type),
    INDEX idx_plan_stage_machine (assigned_machine_id),
    INDEX idx_plan_stage_user (in_charge_user_id),
    INDEX idx_plan_stage_sequence (plan_detail_id, sequence_no)
);

-- Add new notification types for Production Plan workflow
INSERT INTO notification (user_id, type, category, title, message, reference_type, reference_id, is_read, created_at)
SELECT 
    u.id,
    'INFO',
    'SYSTEM',
    'Production Plan System Activated',
    'Production Plan workflow has been activated. Please use the new workflow for creating production orders.',
    'SYSTEM',
    0,
    false,
    NOW()
FROM user u 
WHERE u.role_id IN (
    SELECT id FROM role WHERE name IN ('PLANNING_STAFF', 'DIRECTOR', 'PRODUCTION_STAFF')
);

-- Update existing production orders to reference production plans if they exist
-- This is a data migration step for backward compatibility
UPDATE production_order po
SET notes = CONCAT(IFNULL(po.notes, ''), '\n[LEGACY] Created before Production Plan workflow implementation')
WHERE po.created_at < NOW();

-- Create indexes for better performance
CREATE INDEX idx_production_order_legacy ON production_order(created_at);
CREATE INDEX idx_production_plan_workflow ON production_plan(status, created_at);

-- Add comments for documentation
ALTER TABLE production_plan COMMENT = 'Production planning workflow - replaces direct Production Order creation';
ALTER TABLE production_plan_detail COMMENT = 'Detailed product planning within production plan';
ALTER TABLE production_plan_stage COMMENT = 'Stage-by-stage planning for each product';

-- Insert sample data for testing (optional)
-- This can be uncommented for development/testing purposes
/*
INSERT INTO production_plan (contract_id, plan_code, status, created_by, notes)
SELECT 
    c.id,
    CONCAT('PP-', YEAR(NOW()), '-', LPAD(c.id, 3, '0')),
    'DRAFT',
    1, -- Assuming user ID 1 exists
    'Sample production plan for testing'
FROM contract c 
WHERE c.status = 'APPROVED' 
LIMIT 1;
*/
