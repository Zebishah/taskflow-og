# 🚀 TaskFlow

**TaskFlow** is a full-stack project management SaaS application designed for teams to organize workspaces, manage projects, collaborate with members, and track tasks from one centralized platform.

The project was built with a strong focus on **clean architecture, type safety, authentication, authorization, database design, maintainability, and production-style development practices**.

---

## ✨ Features

### 🔐 Authentication & Sessions

- User registration and login
- JWT-based authentication
- Access and refresh token flow
- Refresh session management
- Session rotation
- Session revocation
- Secure password hashing
- Protected API endpoints

### 🏢 Workspaces

- Create and manage workspaces
- Workspace-based data organization
- Invite members to workspaces
- Workspace membership management
- Role-based permissions

Supported roles include:

- Owner
- Admin
- Member

### 👥 Team Management

- Invite users to workspaces
- Accept workspace invitations
- View workspace members
- Update member roles
- Remove members
- Restrict sensitive actions based on permissions

### 📁 Project Management

- Create projects
- Update project information
- Organize projects inside workspaces
- Archive projects
- Restore archived projects
- Role-based project operations

### ✅ Task Management

TaskFlow is designed around structured task management within projects.

The data model supports concepts such as:

- Tasks
- Projects
- Workspaces
- Members
- Labels
- Users

---

# 🛠️ Tech Stack

## Frontend

- React
- TypeScript
- Vite
- TanStack Query
- Tailwind CSS
- React Router

## Backend

- Node.js
- NestJS
- TypeScript
- REST APIs
- JWT Authentication
- Dependency Injection
- DTO Validation
- Guards

## Database

- PostgreSQL
- Drizzle ORM

## Development & Quality

- ESLint
- Automated testing
- Git / GitHub
- Environment-based configuration

---

# 🏗️ Architecture

TaskFlow follows a separated frontend/backend architecture:

```text
                    USER
                      │
                      ▼
              ┌───────────────┐
              │ React Client  │
              │  TypeScript   │
              └───────┬───────┘
                      │
                   REST API
                      │
                      ▼
              ┌───────────────┐
              │    NestJS     │
              │      API      │
              └───────┬───────┘
                      │
              Services / Business
                    Logic
                      │
                      ▼
              ┌───────────────┐
              │  Drizzle ORM  │
              └───────┬───────┘
                      │
                      ▼
              ┌───────────────┐
              │  PostgreSQL   │
              └───────────────┘
```

The frontend and backend are kept separate so that UI logic, business rules, authentication, and persistence remain clearly separated.

---

# 📂 Project Structure

TaskFlow uses a monorepo-style structure:

```text
taskflow/
│
├── apps/
│   │
│   ├── api/
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── workspaces/
│   │   │   ├── projects/
│   │   │   ├── database/
│   │   │   └── ...
│   │   │
│   │   └── package.json
│   │
│   └── web/
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── hooks/
│       │   ├── lib/
│       │   └── ...
│       │
│       └── package.json
│
└── README.md
```

---

# 🔐 Authentication Flow

TaskFlow uses an access-token and refresh-session architecture.

```text
User Login
    │
    ▼
Credentials Validated
    │
    ▼
Access Token + Refresh Session
    │
    ▼
Access Protected Resources
    │
    ▼
Access Token Expires
    │
    ▼
Refresh Session Validated
    │
    ▼
Session Rotated
    │
    ▼
New Authentication Credentials
```

Refresh sessions can be tracked and revoked instead of relying entirely on a single long-lived JWT.

This provides better control over authenticated sessions.

---

# 🛡️ Role-Based Access Control

TaskFlow uses workspace roles to determine what users are allowed to do.

```text
Workspace
   │
   ├── Owner
   │     └── Full workspace control
   │
   ├── Admin
   │     └── Administrative operations
   │
   └── Member
         └── Standard workspace access
```

Authorization is enforced on the backend rather than relying only on hidden frontend controls.

---

# 🗄️ Data Model

The core domain revolves around:

```text
User
 │
 └── Workspace Membership
          │
          ▼
      Workspace
          │
          ├── Members
          │
          └── Projects
                 │
                 └── Tasks
                        │
                        └── Labels
```

This structure allows TaskFlow to organize data around collaborative workspaces while keeping relationships explicit.

---

# 🔄 Request Flow

A typical authenticated request follows this flow:

```text
React Component
      │
      ▼
TanStack Query
      │
      ▼
API Client
      │
      ▼
NestJS Controller
      │
      ▼
Authentication / Authorization
      │
      ▼
Service
      │
      ▼
Drizzle ORM
      │
      ▼
PostgreSQL
      │
      ▼
API Response
      │
      ▼
TanStack Query Cache
      │
      ▼
React UI
```

---

# 💡 Engineering Decisions

## NestJS Architecture

The backend uses NestJS to maintain clear separation between:

```text
Controllers
    ↓
Request/response handling

Services
    ↓
Business logic

Guards
    ↓
Authentication and authorization

DTOs
    ↓
Input contracts and validation

Database Layer
    ↓
Persistent data access
```

This keeps HTTP concerns separate from application business logic.

---

## PostgreSQL + Drizzle ORM

PostgreSQL provides relational data storage while Drizzle provides a type-safe interface between TypeScript and the database.

The relational model is particularly useful for relationships between:

- Users
- Workspaces
- Memberships
- Projects
- Tasks
- Labels

---

## TanStack Query

The frontend uses TanStack Query for server-state management.

It helps manage:

- API requests
- Loading states
- Error states
- Cached server data
- Mutations
- Refetching
- Cache invalidation

This keeps server data separate from ordinary local UI state.

---

## Authorization on the Backend

Frontend permission checks improve UX, but they are not a security boundary.

TaskFlow validates permissions on the backend before protected operations are performed.

For example:

```text
Request to remove workspace member
              │
              ▼
       Authenticate user
              │
              ▼
      Check workspace role
              │
              ▼
     Validate authorization
              │
       ┌──────┴──────┐
       ▼             ▼
    Allowed        Denied
       │             │
       ▼             ▼
 Perform action    403 response
```

---

# 🧪 Testing

The project is designed with testability in mind.

Important areas for testing include:

- Authentication
- Authorization
- Workspace membership
- Project operations
- Validation
- API behavior
- Frontend user flows

The goal is to verify important business behavior rather than relying only on manual testing.

---

# ⚙️ Local Development

## 1. Clone the repository

```bash
git clone <repository-url>
cd taskflow
```

## 2. Install dependencies

Install the required dependencies according to the repository workspace/package configuration.

```bash
npm install
```

## 3. Configure Environment Variables

Create the required environment configuration for the API.

Typical configuration includes:

```env
DATABASE_URL=your_postgresql_connection_string

JWT_ACCESS_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
```

Use the variable names from the actual project configuration if they differ.

Never commit production secrets to Git.

## 4. Start Development

Start the API and frontend using the scripts defined by the project.

For example:

```bash
npm run dev
```

Refer to the project's `package.json` files for the exact available commands.

---

# 🎯 What This Project Demonstrates

TaskFlow demonstrates practical experience with:

- Full-stack TypeScript development
- React application architecture
- NestJS backend development
- REST API design
- PostgreSQL database design
- Drizzle ORM
- Authentication
- Refresh session management
- Role-based authorization
- Multi-user workspace architecture
- Relational data modeling
- TanStack Query
- API state management
- Validation
- Error handling
- Maintainable project structure
- Production-oriented engineering practices

---

# 🔮 Future Improvements

Possible future improvements include:

- Real-time collaboration
- Task comments
- Notifications
- Activity history
- Advanced project analytics
- Task attachments
- Search and filtering
- Email invitation delivery
- Background jobs
- Redis caching
- Dockerized local environment
- Expanded automated testing
- CI/CD pipeline
- Production monitoring

---

# 👨‍💻 Author

**Zohaib Haider**  
Full Stack Software Engineer

Portfolio: https://zohaib-haider-portfolio.vercel.app/

LinkedIn: https://www.linkedin.com/in/zohaib-haider-390530228/

GitHub: https://github.com/Zebishah
