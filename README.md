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

### Asynchronous Data Flow (Write-Behind Model)
To ensure the API remains extremely fast and can handle high throughput, write operations are offloaded to background workers. The process follows a write-behind pattern utilizing Redis for temporary state and RabbitMQ for task queuing:

```mermaid
graph TD
    Client(["👤 Client Request"]) -->|1. API Call| API["🖥️ API Server"]
    API -->|2. Save Temporary State| Redis[("⚡ Redis Cache\n(Temporary Data)")]
    API -->|3. Publish Event| RabbitMQ{{"🐰 RabbitMQ\n(Message Queue)"}}
    API -.->|4. Fast Success Response| Client
    
    RabbitMQ -->|5. Consume Task| Worker["⚙️ Background Worker"]
    Worker -->|6. Process & Save reliably| Database[("🗄️ PostgreSQL DB\n(Persistent Storage)")]
    Worker -->|7. Delete temp data on success| Redis
```

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

## API Documentation

All endpoints are prefixed with `/api/v1`.

### 🔐 Authentication API

#### 1. Register User
*   **URL**: `/auth/register`
*   **Method**: `POST`
*   **Body**:
    ```json
    {
      "name": "John Doe",
      "email": "john@example.com",
      "password": "securepassword",
      "role": "ANALYST" 
    }
    ```
*   **Response** (200 OK):
    ```json
    {
      "status": 200,
      "message": "OTP sent successfully."
    }
    ```

#### 2. Verify Signup OTP
*   **URL**: `/auth/verify-signup`
*   **Method**: `POST`
*   **Body**:
    ```json
    {
      "email": "john@example.com",
      "otp": "123456"
    }
    ```
*   **Response** (200 OK):
    ```json
    {
      "status": 200,
      "message": "Account verified and logged in successfully",
      "data": {
        "accessToken": "ey..."
      }
    }
    ```

#### 3. Login
*   **URL**: `/auth/login`
*   **Method**: `POST`
*   **Body**:
    ```json
    {
      "email": "john@example.com",
      "password": "securepassword",
      "rememberMe": true
    }
    ```
*   **Response** (200 OK):
    ```json
    {
      "status": 200,
      "message": "Login successful.",
      "data": {
        "accessToken": "ey..."
      }
    }
    ```

#### 4. Refresh Token
*   **URL**: `/auth/refresh-token`
*   **Method**: `POST`
*   **Body**: `{ "refreshToken": "..." }` (Optional if cookie is present)
*   **Response** (200 OK):
    ```json
    {
      "status": 200,
      "message": "Access token refreshed.",
      "data": {
        "accessToken": "ey..."
      }
    }
    ```

#### 5. Forgot Password
*   **URL**: `/auth/forgot-password`
*   **Method**: `POST`
*   **Body**: `{ "email": "john@example.com" }`
*   **Response** (200 OK):
    ```json
    {
      "status": 200,
      "message": "If an account exists, a code has been sent to your email."
    }
    ```

#### 6. Verify Forgot Password OTP
*   **URL**: `/auth/verify-forgot-password`
*   **Method**: `POST`
*   **Body**: `{ "email": "john@example.com", "otp": "123456" }`
*   **Response** (200 OK):
    ```json
    {
      "status": 200,
      "message": "OTP verified successfully.",
      "data": { "accessToken": "ey..." }
    }
    ```

#### 7. Reset Password
*   **URL**: `/auth/reset-password`
*   **Method**: `POST`
*   **Headers**: `Authorization: Bearer <accessToken>`
*   **Body**: `{ "password": "newsecurepassword" }`
*   **Response** (200 OK):
    ```json
    {
      "status": 200,
      "message": "Password changed successfully. Please log in again."
    }
    ```

---

### 👥 User Management API (Admin Only)

#### 1. Fetch All Users
*   **URL**: `/users`
*   **Method**: `GET`
*   **Query Params**: `page` (default 1), `limit` (default 10)
*   **Response** (200 OK):
    ```json
    {
      "status": 200,
      "message": "Users fetched successfully",
      "data": {
        "users": [
          { "id": "uuid", "name": "John", "email": "john@example.com", "role": "ANALYST", "isActive": true }
        ],
        "pagination": { "total": 1, "page": 1, "limit": 10 }
      }
    }
    ```

#### 2. Update User Role
*   **URL**: `/users/:id/role`
*   **Method**: `PATCH`
*   **Body**: `{ "role": "ADMIN" | "ANALYST" | "VIEWER" }`
*   **Response** (200 OK):
    ```json
    {
      "status": 200,
      "message": "User role updated successfully",
      "data": { "id": "uuid", "role": "ADMIN" }
    }
    ```

#### 3. Toggle User Status
*   **URL**: `/users/:id/status`
*   **Method**: `PATCH`
*   **Body**: `{ "isActive": false }`
*   **Response** (200 OK):
    ```json
    {
      "status": 200,
      "message": "User status updated successfully",
      "data": { "id": "uuid", "isActive": false }
    }
    ```

---

### 💰 Finance API

#### 1. Create Financial Record
*   **URL**: `/finance`
*   **Method**: `POST`
*   **Body**:
    ```json
    {
      "amount": 1500.50,
      "type": "INCOME",
      "category": "Salary",
      "date": "2024-03-20T10:00:00Z",
      "description": "Monthly paycheck"
    }
    ```
*   **Response** (201 Created):
    ```json
    {
      "status": 201,
      "message": "Record created successfully",
      "data": { "id": "uuid", "amount": 1500.5, "type": "INCOME", ... }
    }
    ```

#### 2. Fetch Financial Records
*   **URL**: `/finance`
*   **Method**: `GET`
*   **Query Params**: `type` (INCOME/EXPENSE), `category`, `startDate`, `endDate`, `page`, `limit`
*   **Response** (200 OK):
    ```json
    {
      "status": 200,
      "message": "Records fetched successfully",
      "data": {
        "records": [...],
        "pagination": { ... }
      }
    }
    ```

#### 3. Dashboard Summary
*   **URL**: `/finance/dashboard/summary`
*   **Method**: `GET`
*   **Response** (200 OK):
    ```json
    {
      "status": 200,
      "message": "Dashboard summary fetched successfully",
      "data": {
        "totalIncome": 5000,
        "totalExpense": 2000,
        "netBalance": 3000,
        "categoryBreakdown": [
          { "category": "Food", "amount": 500 },
          { "category": "Rent", "amount": 1500 }
        ]
      }
    }
    ```

### Postman Setup
1. Open Postman.
2. Click **Import** and select the `Finance-Dashboard.postman_collection.json` file from the project root.
3. The collection includes a `baseUrl` variable set to `http://localhost:3000/api/v1`.
4. **Automated Token Handling**: The `Login` and `Verify Signup` requests include a test script that automatically saves the `accessToken` to your environment.
5. High-level folders (Finance, Users) are pre-configured to use **Bearer Token** authentication with the `{{accessToken}}` variable.

This application serves as a demonstration of structured thinking about business rules, security handling, and asynchronous API design.
