-- Yarn & Bloom Sample Seed Data
-- Note: Sample prices and content are for demonstration and can be customized via the Admin Dashboard.

USE `yarn_bloom`;

-- Create the initial superadmin through the one-time setup page at /admin/signup.
-- Remove only the previous sample admin account; real admin accounts are preserved.
DELETE FROM `admins`
WHERE `username` = 'admin'
  AND `email` = 'admin@yarnandbloom.co.ke'
  AND `password_hash` = '$2a$10$7vF9a2UqZ6K4e2z9/1u7ueD1lK0k4m8nL3j5qQ7v9W1e3r5t7y9u.';

-- Categories
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `image_url`, `display_order`) VALUES
(1, 'Crochet Bags', 'crochet-bags', 'Handmade everyday totes, shoulder bags, and clutches crafted with durable, soft cotton cord.', '/images/moodboard/sage-crochet-tote.png', 1),
(2, 'Flower Bouquets', 'flower-bouquets', 'Everlasting crochet blooms and botanical arrangements that never wilt, perfect for thoughtful gifts.', '/images/moodboard/crochet-tulip-bouquet.png', 2),
(3, 'Crochet Toys', 'crochet-toys', 'Adorable amigurumi plushies, nursery companions, and heirloom soft toys crocheted with gentle hypoallergenic yarn.', '/images/moodboard/crochet-teddy-bear.png', 3),
(4, 'Gift Sets', 'gift-sets', 'Curated gift hampers combining our signature flowers, bags, and plush keepsakes in luxury packaging.', '/images/moodboard/crochet-gift-box.png', 4)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `slug` = VALUES(`slug`), `image_url` = VALUES(`image_url`);

-- Products
INSERT INTO `products` (
    `id`, `category_id`, `name`, `slug`, `short_description`, `detailed_description`,
    `price`, `compare_at_price`, `stock_status`, `estimated_production_days`,
    `materials`, `dimensions`, `available_colors`, `is_customizable`, `is_featured`,
    `is_active`, `occasions`, `primary_image`, `care_instructions`
) VALUES
(
    1, 1, 'The Sunday Tote', 'the-sunday-tote',
    'A spacious, textured crochet tote bag with sturdy double handles for your market runs and weekend strolls.',
    'Carefully handcrafted using premium 100% recycled cotton yarn in our signature ribbed cluster stitch. The Sunday Tote is both lightweight and surprisingly durable, designed to carry your daily essentials, books, or farmers market treasures with graceful ease. Features reinforced handles and a charming scalloped rim.',
    3200.00, 3600.00, 'made_to_order', 4,
    '100% Recycled Cotton Cord, Brass Magnetic Snap',
    '34cm width x 30cm height (handle drop 25cm)',
    'Sage Green, Warm Cream, Oatmeal Beige, Terracotta, Deep Forest',
    TRUE, TRUE, TRUE, 'Birthday, Everyday, Self Care, Mother''s Day',
    '/images/moodboard/sage-crochet-tote.png',
    'Gently spot clean with cool water and mild organic soap. Lay flat to dry on a clean towel. Do not tumble dry, wring, or bleach.'
),
(
    2, 2, 'Forever Bloom Bouquet', 'forever-bloom-bouquet',
    'A breathtaking artisan bouquet of crochet roses, daisies, lavender sprigs, and eucalyptus leaves that never wilt.',
    'Express your lasting affection with flowers that stay fresh forever. This signature bouquet features 7 meticulously crocheted stems: 2 blush roses, 2 creamy daisies, 2 fragrant purple lavender sprigs, and handcrafted eucalyptus foliage wrapped in craft paper with rustic twine and a personalized calligraphy tag.',
    2800.00, 3200.00, 'in_stock', 2,
    'Mercerized Cotton Yarn, Coated Floral Wire Stems, Eco Kraft Paper',
    'Height approx 38cm, Diameter approx 22cm',
    'Classic Pastel (Blush/Cream), Sunset Warmth (Peach/Mustard), Botanical Sage (Ivory/Eucalyptus)',
    TRUE, TRUE, TRUE, 'Anniversary, Birthday, Graduation, Valentine''s Day, Congratulations',
    '/images/moodboard/crochet-tulip-bouquet.png',
    'Dust gently with a soft dry brush or cool hair dryer setting. Keep away from direct moisture and prolonged harsh sunlight.'
),
(
    3, 3, 'Honey Bear', 'honey-bear',
    'A delightfully huggable amigurumi teddy bear wearing a miniature knitted scarf and safety eyes.',
    'Our beloved Honey Bear is crocheted by hand in super-soft milk cotton yarn. Stuffed with hypoallergenic polyester fiberfill and fitted with child-safe lock eyes, Honey Bear is made to be treasured across generations as a nursery bedtime companion or baby shower keepsake.',
    1800.00, NULL, 'in_stock', 3,
    'Milk Cotton Yarn, Hypoallergenic Polyfill, Safety Eyes',
    '24cm seated height x 16cm width',
    'Honey Caramel, Soft Cream, Warm Taupe, Sage Moss',
    TRUE, TRUE, TRUE, 'Baby Shower, Birthday, Newborn Keepsake, Thinking of You',
    '/images/moodboard/crochet-teddy-bear.png',
    'Hand wash in lukewarm water with gentle baby detergent. Squeeze gently without twisting; air dry in the shade.'
),
(
    4, 2, 'Daisy Mini Bouquet', 'daisy-mini-bouquet',
    'A cheerful, compact bunch of vibrant hand-stitched daisies designed to brighten up any desk or windowsill.',
    'Five joyful crochet daisies with golden centers and bendable green stems, tied together with raw chiffon ribbon. Perfect as a quick "thinking of you" gesture, desk companion, or teacher appreciation token.',
    1400.00, 1600.00, 'in_stock', 2,
    '100% Combed Cotton, Flexible Floral Wire, Silk Chiffon Ribbon',
    'Height 25cm, Bundle width 14cm',
    'Pure White & Gold, Pastel Pink & Buttercup, Lavender Daisy Mix',
    TRUE, FALSE, TRUE, 'Thank You, Friend''s Birthday, Desk Decor, Get Well Soon',
    '/images/moodboard/crochet-flower-bouquets.png',
    'Wipe lightly with a dry microfiber cloth. Stem wires can be gently bent to suit your favorite vase.'
),
(
    5, 1, 'The Everyday Pouch', 'the-everyday-pouch',
    'A chic textured crochet zippered pouch ideal for makeup, pencils, keys, or tech accessories.',
    'Minimalist and tactile, The Everyday Pouch features a tight moss stitch pattern that prevents small items from slipping through, lined with soft linen fabric and finished with a smooth metallic zip and a handcrafted yarn tassel.',
    1600.00, NULL, 'in_stock', 2,
    'Organic Cotton Yarn, Linen Inner Lining, Antique Brass Zipper',
    '22cm length x 15cm height x 5cm base',
    'Oatmeal Beige, Deep Forest Green, Dusty Rose, Mustard Honey',
    TRUE, FALSE, TRUE, 'Everyday, Birthday, Bridesmaid Gift, Self Care',
    '/images/moodboard/cream-daisy-tote.png',
    'Hand wash lining gently, spot clean exterior with damp cloth. Reshape and dry flat away from direct heat.'
),
(
    6, 3, 'Little Cloud Bunny', 'little-cloud-bunny',
    'An heirloom floppy-eared bunny stuffed with love, perfect for little hands to cuddle.',
    'With long, sweet droopy ears and an embroidered heart nose, Little Cloud Bunny is an instant favorite for babies and young children. Soft to the touch and lightweight, it makes the perfect cuddle companion.',
    2000.00, 2400.00, 'made_to_order', 3,
    'Organic Bamboo-Cotton Blend Yarn, Hypoallergenic Polyfill',
    '30cm tip of ears to toes',
    'Cloud White, Blush Meadow, Mist Grey, Warm Biscuit',
    TRUE, TRUE, TRUE, 'New Baby, First Birthday, Easter, Baby Shower',
    '/images/moodboard/crochet-animal-friends.png',
    'Hand wash gently in cool water. Reshape ears while damp and lay flat to dry.'
),
(
    7, 4, 'Blossom & Bear Gift Box', 'blossom-and-bear-gift-box',
    'A curated luxury keepsake gift box featuring our Honey Bear, Forever Bloom mini bouquet, and a personalized card.',
    'A complete gift ready to impress. Includes our handcrafted Honey Bear, a coordinating 3-stem crochet bloom bouquet, botanical tissue wrap, a premium rigid keepsake gift box tied with sage ribbon, and a customized handwritten wax-sealed greeting card.',
    4500.00, 5200.00, 'made_to_order', 4,
    'Handmade Crochet Items, Rigid Keepsake Box, Chiffon Ribbon, Wax Seal Card',
    'Box dimensions: 28cm x 22cm x 12cm',
    'Sage & Cream, Rose & Ivory, Warm Honey & Taupe',
    TRUE, TRUE, TRUE, 'Anniversary, Romantic, New Mum, Milestone Birthday',
    '/images/moodboard/crochet-gift-box.png',
    'Refer to individual product care guides inside the box.'
),
(
    8, 1, 'Lavender Garden Tote', 'lavender-garden-tote',
    'An intricate floral granny square shoulder bag with vintage charm and sturdy woven straps.',
    'A true celebration of slow fashion. Thirteen individual floral squares crocheted in harmonious earthy hues and joined with delicate border stitches. Lined with sturdy cotton canvas with an interior pocket for your smartphone.',
    3500.00, 3900.00, 'made_to_order', 5,
    '100% Egyptian Cotton Yarn, Canvas Interior Lining, Canvas Pocket',
    '36cm x 36cm with 28cm shoulder strap drop',
    'Lavender & Sage, Sunlit Amber, Vintage Rose',
    TRUE, FALSE, TRUE, 'Weekend Outing, Vacation, Birthday, Creative Gift',
    '/images/moodboard/sage-crossbody-bag.png',
    'Spot clean or delicate dry clean. Do not machine wash.'
)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `price` = VALUES(`price`), `primary_image` = VALUES(`primary_image`), `is_active` = VALUES(`is_active`);

-- Product Images (Additional gallery images)
INSERT INTO `product_images` (`product_id`, `image_url`, `alt_text`, `is_primary`, `sort_order`) VALUES
(1, '/images/moodboard/sage-crochet-tote.png', 'The Sunday Tote in sage green', TRUE, 1),
(1, '/images/moodboard/cream-daisy-tote.png', 'Handmade crochet tote detail', FALSE, 2),
(2, '/images/moodboard/crochet-tulip-bouquet.png', 'Forever Bloom crochet bouquet', TRUE, 1),
(2, '/images/moodboard/crochet-flower-bouquets.png', 'Handmade crochet flowers in soft colours', FALSE, 2),
(3, '/images/moodboard/crochet-teddy-bear.png', 'Honey Bear crochet plush', TRUE, 1),
(3, '/images/moodboard/crochet-animal-friends.png', 'Handmade crochet animal toys', FALSE, 2),
(4, '/images/moodboard/crochet-flower-bouquets.png', 'Daisy Mini crochet bouquet', TRUE, 1),
(5, '/images/moodboard/cream-daisy-tote.png', 'The Everyday Pouch in warm beige', TRUE, 1),
(6, '/images/moodboard/crochet-animal-friends.png', 'Little Cloud Bunny crochet plush', TRUE, 1),
(7, '/images/moodboard/crochet-gift-box.png', 'Blossom and Bear handmade gift box', TRUE, 1),
(8, '/images/moodboard/sage-crossbody-bag.png', 'Lavender Garden crochet tote', TRUE, 1);

-- Customer Testimonials / Reviews (Clearly labeled sample reviews)
INSERT INTO `reviews` (`id`, `product_id`, `customer_name`, `rating`, `comment`, `is_approved`, `is_featured`) VALUES
(1, 1, 'Amina W.', 5, 'The Sunday Tote is even more stunning in person! The craftsmanship is impeccable and the sage color goes with everything.', TRUE, TRUE),
(2, 2, 'David K.', 5, 'Ordered the Forever Bloom bouquet for our anniversary. My wife was in awe — it will literally last forever and looks so charming!', TRUE, TRUE),
(3, 3, 'Wanjiku M.', 5, 'I gifted the Honey Bear for my niece''s first birthday. So soft, completely safe, and arrived in the most elegant packaging.', TRUE, TRUE),
(4, 5, 'Sarah N.', 5, 'The Everyday Pouch is my new favorite makeup bag. The lining is neat, the zipper is sturdy, and the stitches are so even!', TRUE, FALSE)
ON DUPLICATE KEY UPDATE `customer_name` = VALUES(`customer_name`);

-- Application Settings
INSERT INTO `application_settings` (`setting_key`, `setting_value`, `description`) VALUES
('whatsapp_number', '254141703242', 'Official business WhatsApp number for customer orders and enquiries'),
('business_name', 'Yarn & Bloom', 'Official trading name'),
('business_slogan', 'More than crochet — handmade gifts designed around your story.', 'Brand tagline'),
('business_email', 'zuhuraabdalla495@gmail.com', 'Public customer support email address'),
('business_phone', '+254141703242', 'Public contact phone number'),
('business_hours', 'Monday – Saturday: 9:00 AM – 6:00 PM EAT (Closed Sundays)', 'Store operational hours'),
('business_location', 'Nairobi, Kenya (Delivery nationwide & pickup available)', 'Workshop address / location'),
('announcement_bar', 'Handmade in Kenya • Free handwritten message card with every gift box!', 'Header announcement ribbon text'),
('instagram_handle', '@yarnandbloom.ke', 'Instagram social link'),
('delivery_info', 'Standard Nairobi courier: 1-2 business days (KSh 300). Upcountry express: 2-3 business days (KSh 450). Free pickup in Westlands, Nairobi.', 'Shipping and delivery policy details')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);
