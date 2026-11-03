# Yarn & Bloom

A handmade crochet storefront and enquiry platform built with Express.js, EJS, MySQL, and WhatsApp click-to-chat ordering.

## Features

- Responsive storefront for handmade crochet products
- Product catalogue with category filters and search
- Product detail pages with WhatsApp ordering links
- Persistent browser shopping bag and server-priced guest checkout
- Order enquiry and line-item records saved transactionally in MySQL
- Custom order enquiry form and confirmation page
- Gift box builder with live price estimation
- AI-assisted crochet gift finder and gift box builder, with catalog-matching fallback
- Contact and FAQ pages
- Admin authentication and product/enquiry management
- Admin-managed product inventory, image uploads, categories, and live shop availability
- Secure session handling and validation

## Local setup on Windows (PowerShell)

1. Install Node.js 22+ from https://nodejs.org/
2. Install MySQL Server or use XAMPP/WAMP with MySQL enabled.
3. Open PowerShell in the project folder:

   ```powershell
   cd "C:\Users\Zuhura\Desktop\Yarn&bloom"
   npm install
   ```

4. Create a local environment file from the example if needed:

   ```powershell
   Copy-Item .env.example .env
   ```

5. Update the database credentials in `.env`:

   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=yarn_bloom
   SESSION_SECRET=replace_with_a_long_random_secret
   AI_GATEWAY_API_KEY=your_private_gateway_key
   AI_GATEWAY_MODEL=google/gemini-2.5-flash-lite
   WHATSAPP_NUMBER=254141703242
   DELIVERY_FEE_KSH=0
   ```

   The AI gift features use the Vercel AI Gateway. Add your API key to the local `.env` file (never commit it); without a key, both tools continue to suggest items using the local catalog matcher. You can change `AI_GATEWAY_MODEL` to another current model ID supported by your Gateway account.

6. Create the database and load sample data:

   ```powershell
   npm run seed
   ```

   This loads the catalogue and its local image paths. Product browsing requires seeded catalogue data; the app deliberately does not invent products if the database is empty.

7. Start the server:

   ```powershell
   npm start
   ```

8. Open the app at:

   ```text
   http://localhost:3000
   ```

## Admin setup and login

After starting the app, open `http://localhost:3000/admin`. If no admin account exists, the one-time setup page appears first. Create the initial superadmin account, then sign in on the login page. Once an admin exists, visitors can submit a public admin access request; a superadmin must approve it before an admin account is created. Signed-in superadmins can also create regular admin accounts from the dashboard.

## Testing

Run the automated tests:

```powershell
npx jest --runInBand --detectOpenHandles --forceExit
```

## Deployment notes

- Set environment variables securely in production.
- Configure `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` on Render to point to a reachable MySQL database. The site currently renders an empty shop if that database has no active products; it does not seed live data automatically.
- Do not run the sample `database/seed.sql` against production unless you intend to publish its sample catalogue. Create the real categories and products in the admin area or import the business's actual catalogue; products saved as active appear in the shop.
- Existing databases need the checkout tables from `database/migrations/001-store-orders.sql`, admin access request table from `database/migrations/002-admin-access-requests.sql`, and product inventory/categories from `database/migrations/003-product-inventory.sql`. New databases receive the product inventory column from `database/schema.sql`; run `npm run seed` to initialize the catalog and categories. Existing in-stock products receive one available unit from the inventory migration; update quantities to match the real stock before accepting checkout orders.
- Checkout reserves tracked `in_stock` quantities in the same transaction that saves the order. `made_to_order` products remain available without a finite stock count.
- `DELIVERY_FEE_KSH=0` sets the current checkout delivery fee. Update the server environment and restart the service if the fee changes. Orders are saved as pending enquiries and can be reviewed in **Admin → Enquiries**; no online payment is taken or marked paid.
- Render's local filesystem is ephemeral. If admins upload product images, attach a persistent disk and set `UPLOAD_DIR` to a directory on its mount path; otherwise uploaded files can disappear after a restart or redeploy. Keep the image URL paths saved in MySQL consistent with the hosted files.
- Use a real MySQL server with strong credentials.
- Keep `WHATSAPP_NUMBER` in international format without spaces or plus signs.
- Use HTTPS in production and consider a reverse proxy such as Nginx.

## Important note

The project is designed to work with real MySQL configuration and a valid WhatsApp number. If MySQL is not running locally, the app will still boot but database-backed pages will show empty states unless connected to a database.
