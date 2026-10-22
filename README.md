# Yarn & Bloom

A handmade crochet storefront and enquiry platform built with Express.js, EJS, MySQL, and WhatsApp click-to-chat ordering.

## Features

- Responsive storefront for handmade crochet products
- Product catalogue with category filters and search
- Product detail pages with WhatsApp ordering links
- Custom order enquiry form and confirmation page
- Gift box builder with live price estimation
- Crochet gift finder quiz using a rule-based recommendation engine
- Contact and FAQ pages
- Admin authentication and product/enquiry management
- Secure session handling and validation

## Local setup on Windows (PowerShell)

1. Install Node.js 18+ from https://nodejs.org/
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
   WHATSAPP_NUMBER=254141703242
   ```

6. Create the database and load sample data:

   ```powershell
   npm run seed
   ```

7. Start the server:

   ```powershell
   npm start
   ```

8. Open the app at:

   ```text
   http://localhost:3000
   ```

## Admin login

Default admin account from the sample data:

- Username: `admin`
- Email: `admin@yarnandbloom.co.ke`
- Password: `Admin@YarnBloom2025!`

## Testing

Run the automated tests:

```powershell
npx jest --runInBand --detectOpenHandles --forceExit
```

## Deployment notes

- Set environment variables securely in production.
- Use a real MySQL server with strong credentials.
- Keep `WHATSAPP_NUMBER` in international format without spaces or plus signs.
- Use HTTPS in production and consider a reverse proxy such as Nginx.

## Important note

The project is designed to work with real MySQL configuration and a valid WhatsApp number. If MySQL is not running locally, the app will still boot but database-backed pages will show empty states unless connected to a database.
