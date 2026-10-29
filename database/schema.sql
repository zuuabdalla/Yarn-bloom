-- Yarn & Bloom Database Schema
-- Charset: utf8mb4

CREATE DATABASE IF NOT EXISTS `yarn_bloom` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `yarn_bloom`;

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS `admins` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(120) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(20) NOT NULL DEFAULT 'admin',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS `categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL UNIQUE,
    `description` TEXT NULL,
    `image_url` VARCHAR(255) NULL,
    `display_order` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Products Table
CREATE TABLE IF NOT EXISTS `products` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `category_id` INT NULL,
    `name` VARCHAR(150) NOT NULL,
    `slug` VARCHAR(160) NOT NULL UNIQUE,
    `short_description` VARCHAR(255) NOT NULL,
    `detailed_description` TEXT NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `compare_at_price` DECIMAL(10, 2) NULL,
    `stock_status` ENUM('in_stock', 'made_to_order', 'out_of_stock') DEFAULT 'made_to_order',
    `estimated_production_days` INT DEFAULT 3,
    `materials` VARCHAR(255) DEFAULT '100% Cotton Yarn, Polyester Fiberfill',
    `dimensions` VARCHAR(255) NULL,
    `available_colors` TEXT NULL, -- comma or JSON separated list of color names
    `is_customizable` BOOLEAN DEFAULT TRUE,
    `is_featured` BOOLEAN DEFAULT FALSE,
    `is_active` BOOLEAN DEFAULT TRUE,
    `occasions` VARCHAR(255) NULL, -- comma separated, e.g. Birthday, Anniversary, Graduation
    `primary_image` VARCHAR(255) NOT NULL,
    `care_instructions` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
    INDEX `idx_products_category` (`category_id`),
    INDEX `idx_products_featured` (`is_featured`),
    INDEX `idx_products_price` (`price`),
    INDEX `idx_products_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Product Images Table
CREATE TABLE IF NOT EXISTS `product_images` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `product_id` INT NOT NULL,
    `image_url` VARCHAR(255) NOT NULL,
    `alt_text` VARCHAR(150) NULL,
    `is_primary` BOOLEAN DEFAULT FALSE,
    `sort_order` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
    INDEX `idx_product_images_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Custom Order Enquiries Table
CREATE TABLE IF NOT EXISTS `custom_order_enquiries` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `reference_number` VARCHAR(30) NOT NULL UNIQUE,
    `customer_name` VARCHAR(120) NOT NULL,
    `whatsapp_number` VARCHAR(30) NOT NULL,
    `category_id` INT NULL,
    `preferred_colors` VARCHAR(255) NULL,
    `desired_size` VARCHAR(100) NULL,
    `design_description` TEXT NOT NULL,
    `occasion` VARCHAR(100) NULL,
    `budget` DECIMAL(10, 2) NULL,
    `required_date` DATE NULL,
    `reference_image_url` VARCHAR(255) NULL,
    `additional_instructions` TEXT NULL,
    `status` ENUM('pending', 'in_review', 'quoted', 'in_production', 'completed', 'cancelled') DEFAULT 'pending',
    `admin_notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_custom_orders_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
    INDEX `idx_custom_orders_status` (`status`),
    INDEX `idx_custom_orders_ref` (`reference_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Contact Enquiries Table
CREATE TABLE IF NOT EXISTS `contact_enquiries` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `subject` VARCHAR(150) NOT NULL,
    `message` TEXT NOT NULL,
    `status` ENUM('unread', 'read', 'responded', 'archived') DEFAULT 'unread',
    `admin_notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Reviews Table
CREATE TABLE IF NOT EXISTS `reviews` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `product_id` INT NULL,
    `customer_name` VARCHAR(100) NOT NULL,
    `rating` INT NOT NULL DEFAULT 5,
    `comment` TEXT NOT NULL,
    `is_approved` BOOLEAN DEFAULT TRUE,
    `is_featured` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
    INDEX `idx_reviews_product` (`product_id`),
    INDEX `idx_reviews_approved` (`is_approved`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Gift Box Enquiries Table
CREATE TABLE IF NOT EXISTS `gift_box_enquiries` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `reference_number` VARCHAR(30) NOT NULL UNIQUE,
    `customer_name` VARCHAR(120) NOT NULL,
    `whatsapp_number` VARCHAR(30) NOT NULL,
    `color_theme` VARCHAR(100) NOT NULL,
    `recipient_name` VARCHAR(120) NULL,
    `gift_message` TEXT NULL,
    `occasion` VARCHAR(100) NULL,
    `max_budget` DECIMAL(10, 2) NULL,
    `estimated_total` DECIMAL(10, 2) NOT NULL,
    `selected_items` JSON NOT NULL,
    `status` ENUM('pending', 'in_review', 'quoted', 'in_production', 'completed', 'cancelled') DEFAULT 'pending',
    `admin_notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Application Settings Table
CREATE TABLE IF NOT EXISTS `application_settings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `setting_key` VARCHAR(100) NOT NULL UNIQUE,
    `setting_value` TEXT NOT NULL,
    `description` VARCHAR(255) NULL,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Customer Checkout Orders
CREATE TABLE IF NOT EXISTS `store_orders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `reference_number` VARCHAR(32) NOT NULL UNIQUE,
    `customer_name` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(30) NOT NULL,
    `email` VARCHAR(120) NULL,
    `delivery_location` VARCHAR(500) NOT NULL,
    `gift_message` VARCHAR(500) NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `delivery_fee` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('pending', 'confirmed', 'in_production', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    `payment_status` ENUM('awaiting_confirmation', 'paid', 'failed') NOT NULL DEFAULT 'awaiting_confirmation',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_store_orders_status` (`status`),
    INDEX `idx_store_orders_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Customer Checkout Order Items
CREATE TABLE IF NOT EXISTS `store_order_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_id` INT NOT NULL,
    `product_id` INT NULL,
    `product_name` VARCHAR(150) NOT NULL,
    `product_slug` VARCHAR(160) NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `quantity` INT UNSIGNED NOT NULL,
    `selected_color` VARCHAR(120) NOT NULL,
    `customization` VARCHAR(500) NULL,
    `line_total` DECIMAL(10, 2) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_store_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `store_orders` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_store_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
    INDEX `idx_store_order_items_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
