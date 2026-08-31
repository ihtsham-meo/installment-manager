CREATE TABLE IF NOT EXISTS branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO branches (id, name)
SELECT 1, 'Main Branch' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE id = 1);

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role ENUM('admin','manager','cashier') NOT NULL,
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT DEFAULT 1,
    full_name VARCHAR(100) NOT NULL,
    cnic VARCHAR(20) UNIQUE,
    phone VARCHAR(20),
    address VARCHAR(255),
    photo_path VARCHAR(255),
    doc_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customer_guarantors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    cnic VARCHAR(20),
    phone VARCHAR(20),
    doc_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT DEFAULT 1,
    name VARCHAR(150) NOT NULL,
    company VARCHAR(100),
    category VARCHAR(100),
    barcode VARCHAR(100),
    cost_price DECIMAL(12,2) NOT NULL,
    sale_price DECIMAL(12,2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'pcs',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT DEFAULT 1,
    customer_id INT NOT NULL,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(12,2) NOT NULL,
    down_payment DECIMAL(12,2) DEFAULT 0,
    installment_count INT NOT NULL,
    installment_amount DECIMAL(12,2) NOT NULL,
    plan_start_date DATE NOT NULL,
    frequency VARCHAR(20) DEFAULT 'monthly',
    status ENUM('active','completed','defaulted','cancelled') DEFAULT 'active',
    voided TINYINT(1) DEFAULT 0,
    voided_by INT NULL,
    voided_at TIMESTAMP NULL,
    void_reason VARCHAR(255),
    created_by INT,
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (voided_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS installment_schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    installment_no INT NOT NULL,
    due_date DATE NOT NULL,
    due_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    late_fee DECIMAL(12,2) DEFAULT 0,
    status ENUM('pending','partial','paid','overdue') DEFAULT 'pending',
    paid_date TIMESTAMP NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    installment_schedule_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(30) DEFAULT 'cash',
    received_by INT,
    voided TINYINT(1) DEFAULT 0,
    voided_by INT NULL,
    voided_at TIMESTAMP NULL,
    notes VARCHAR(255),
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (installment_schedule_id) REFERENCES installment_schedule(id),
    FOREIGN KEY (received_by) REFERENCES users(id),
    FOREIGN KEY (voided_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS late_fee_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rule_type ENUM('fixed','percent_per_day','percent_per_week') NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    active TINYINT(1) DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS licenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    license_key VARCHAR(100) UNIQUE NOT NULL,
    machine_id VARCHAR(100),
    activated_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    status ENUM('active','expired','revoked') DEFAULT 'active'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(50),
    table_name VARCHAR(50),
    record_id INT,
    old_value TEXT,
    new_value TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS backups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    backup_path VARCHAR(255),
    backup_type ENUM('local','cloud','usb') NOT NULL,
    encrypted TINYINT(1) DEFAULT 1,
    size_bytes BIGINT,
    status VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
