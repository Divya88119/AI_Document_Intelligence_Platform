# AI Document Intelligence Platform

An enterprise-grade document processing, information extraction, and conversational semantic Q&A platform built with **ASP.NET Core 8 Web API**, **Entity Framework Core (SQL Server)**, and a **React 18 + Vite + TypeScript** frontend.

---

## Key Capabilities

-  **Multi-Format Document Ingestion**: Supports `.pdf`, `.docx`, `.xlsx`, `.txt`, `.csv`, `.json`, `.png`, and `.jpg` up to 15 MB.
- ⚡ **Asynchronous Background Processing Queue**: Channel-backed worker automatically processes uploads without blocking HTTP requests.
- 🧠 **Multi-Engine AI Pipeline**:
  - **Text & Table Extraction**: High-fidelity page extraction with `PdfPig` and OpenXML.
  - **Automated Classification**: Automatically tags documents as Invoices, Legal Contracts, Resumes, Financial Reports, Technical Specs, IDs, etc.
  - **Key-Value & Entity Extraction**: Identifies dates, financial figures, parties, candidate names, contact emails, phone numbers, and invoice numbers.
  - **Executive Summaries & Action Items**: Generates executive briefs and recommended next actions.
  - **Hybrid AI Architecture**: Seamless integration with **Google Gemini API**, **OpenAI API**, and an offline **Built-in NLP & Heuristic Engine**.
- 💬 **Interactive "Chat with Document"**: Grounded conversational AI assistant allowing users to ask specific questions about document content with full audit history.
- 👥 **Role-Based Access & User Management**: Admin and standard user roles, JWT authentication, BCrypt hashing, and soft-delete user controls.
- 📊 **Real-time Analytics Dashboard**: Document processing status breakdown, storage telemetry, category distribution, and live polling.

---

## Project Structure

```
AI_Document_Intelligence_Platform/
├── backend/
│   └── DocumentIntelligence.API/      # ASP.NET Core 8 Web API
│       ├── Controllers/                # REST Controllers (Docs, Auth, Chat, Dashboard)
│       ├── Data/                       # ApplicationDbContext & Admin Seeder
│       ├── Models/                     # Entities & DTOs
│       ├── Repositories/               # Data access layer & interfaces
│       ├── Services/                   # AI, Extraction, Background Worker, Auth Services
│       └── storage/documents/          # Ingested file repository
├── frontend/                           # Modern React 18 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/                 # Dropzone, Badges, Navbar, Sidebar
│   │   ├── context/                    # AuthContext & Session Management
│   │   ├── pages/                      # Dashboard, Hub, Document Studio, Users, Login
│   │   ├── services/                   # Axios API client & Interceptors
│   │   └── types/                      # TypeScript domain models
├── database/                           # SQL Server schema creation script
└── docs/                               # Architecture, API Reference, Setup Guide
```

---

## Quick Start

### 1. Backend (.NET 8 Web API)
```powershell
cd backend/DocumentIntelligence.API
dotnet run
```
Swagger API available at: `http://localhost:5000/swagger`

### 2. Frontend (React + Vite)
```powershell
cd frontend
npm install
npm run dev
```
Web App available at: `http://localhost:5173`

### 3. Default Admin Credentials
- **Email**: `admin@docintel.io`
- **Password**: `AdminPassword123!`
*(Or use the 1-click **Auto-fill** button on the login screen).*

