ALTER TABLE `products`
    ADD COLUMN `stock_quantity` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `stock_status`;

UPDATE `products`
SET `stock_quantity` = 1
WHERE `stock_status` = 'in_stock';

INSERT INTO `categories` (`name`, `slug`, `description`, `display_order`) VALUES
    ('Crochet Bags', 'crochet-bags', 'Handmade crochet bags and accessories.', 1),
    ('Crochet Flowers', 'crochet-flowers', 'Handmade crochet flowers and bouquets.', 2),
    ('Crochet Toys', 'crochet-toys', 'Soft handmade crochet toys.', 3),
    ('Baby Accessories', 'baby-accessories', 'Thoughtful handmade accessories for babies.', 4),
    ('Crochet Hats', 'crochet-hats', 'Handmade crochet hats and headwear.', 5),
    ('Gift Sets', 'gift-sets', 'Curated handmade crochet gift sets.', 6),
    ('Custom Creations', 'custom-creations', 'Custom-designed handmade crochet pieces.', 7)
ON DUPLICATE KEY UPDATE
    `name` = VALUES(`name`),
    `description` = VALUES(`description`),
    `display_order` = VALUES(`display_order`);
