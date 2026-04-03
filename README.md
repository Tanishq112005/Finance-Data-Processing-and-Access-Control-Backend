# Finance Data Processing and Access Control Backend

This is the backend implementation for the Finance Dashboard assignment. The system supports full user role-based access control (RBAC), robust finance record management, and is engineered for scalability utilizing Redis for caching and RabbitMQ for message queuing. 

## Key Features
- **User and Role Management**: Dedicated endpoints for an Admin to view users and change their status (Active/Inactive) or role (Viewer/Analyst/Admin).
- **Authentication**: JWT & OTP-based verification for login, registration, and password recovery.
- **Financial Records**: Create, read, update, delete, with automatic soft-delete functionality.
- **Access Control Logic**: Different roles are constrained to correct routes using the `authorizeRoles` middleware.
- **Dashboard APIs**: Analytical summaries for incomes, expenses, net balance, and category aggregations.
- **Message Queues**: Heavy lifting (emails, persistent database record syncing) is done via RabbitMQ message queues to keep the API server lightweight.
- **Caching**: Write-behind caching utilizing Redis.
- **Input Validation**: Zod parsing validates every incoming payload across all endpoints.

## Architecture Highlights
- **Layered Architecture:** Clear isolation across Controllers, Services, Repositories, Schemas, and Routes.
- **Database:** Prisma with PostgreSQL.
- **Rate Limiting:** IP-based request throttling using Redis to prevent brute-forcing.

## Requirements
- Node.js
- PostgreSQL
- Redis Server
- RabbitMQ Server

## Instructions to Run

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Duplicate `.env.example` (or set up `.env`) with the requisite keys:
   ```env
   DATABASE_URL="postgresql://user:pass@localhost:5432/finance_db?schema=public"
   RABBITMQ_URL="amqp://localhost"
   REDIS_URL="redis://localhost:6379"
   JWT_KEY="your_secret"
   JWT_REFRESH_KEY="your_refresh_secret"
   ```

3. Ensure Data schema & Client are synchronized:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Seed the Initial Admin User:**
   ```bash
   npx prisma db seed
   ```
   *This creates an admin user with the email `admin@example.com` and password `adminpassword123` so you can test role management immediately.*

5. Start the Server:
   ```bash
   npm run start
   ```

## Included Postman / API Usage
Endpoints follow standard `/api/v1/*` patterns:
- `/api/v1/users` (Fetch users) [ADMIN ONLY]
- `/api/v1/users/:id/role` (Update specific role) [ADMIN ONLY]
- `/api/v1/users/:id/status` (Toggle active state) [ADMIN ONLY]
- `/api/v1/finance/` (Dashboard Stats, View, Create, Update, Delete) [RBAC protected]
- `/api/v1/auth/` (Login, Register, Refresh Token)

### Postman Setup
1. Open Postman.
2. Click **Import** and select the `Finance-Dashboard.postman_collection.json` file from the project root.
3. The collection includes a `baseUrl` variable set to `http://localhost:3000/api/v1`.
4. **Automated Token Handling**: The `Login` and `Verify Signup` requests include a test script that automatically saves the `accessToken` to your environment.
5. High-level folders (Finance, Users) are pre-configured to use **Bearer Token** authentication with the `{{accessToken}}` variable.

This application serves as a demonstration of structured thinking about business rules, security handling, and asynchronous API design.
