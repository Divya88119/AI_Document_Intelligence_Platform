# AI Document Intelligence Platform — Setup & Execution Guide

This guide explains how to configure and run the backend API and frontend React client.

---

## 1. Prerequisites
- **.NET 8 SDK** (verify with `dotnet --version`)
- **Node.js 18+ & npm** (verify with `node -v` and `npm -v`)
- **SQL Server / LocalDB** (or SQL Server Express)

---

## 2. Backend Configuration (`backend/DocumentIntelligence.API`)

### 2.1 Configure `appsettings.json`
Open `backend/DocumentIntelligence.API/appsettings.json` and configure your database connection and optional AI API keys:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=DocumentIntelligenceDB;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "InitialAdmin": {
    "FullName": "System Administrator",
    "Email": "admin@docintel.io",
    "Password": "AdminPassword123!"
  },
  "AiSettings": {
    "Provider": "Auto",
    "GeminiApiKey": "YOUR_GEMINI_API_KEY_OPTIONAL",
    "GeminiModel": "gemini-1.5-flash",
    "OpenAiApiKey": "YOUR_OPENAI_API_KEY_OPTIONAL",
    "OpenAiModel": "gpt-4o-mini"
  }
}
```

> [!NOTE]
> If you leave `GeminiApiKey` and `OpenAiApiKey` empty, the system automatically uses the **built-in heuristic and rule-based NLP engine**, allowing 100% full functionality without any paid API keys!

### 2.2 Apply Database Migrations
Run the following from the project root:
```powershell
cd backend/DocumentIntelligence.API
dotnet ef database update
```
*(Alternatively, you can run the SQL script located at `database/schema.sql` directly in SQL Server Management Studio).*

### 2.3 Run Backend API
```powershell
dotnet run
```
The API will start on `http://localhost:5000` (or `https://localhost:7001`).
You can explore the Swagger UI at `http://localhost:5000/swagger`.

---

## 3. Frontend Application (`frontend/`)

### 3.1 Install Dependencies
From the `frontend/` folder:
```powershell
cd frontend
npm install
```

### 3.2 Run Frontend Development Server
```powershell
npm run dev
```
Open your browser at `http://localhost:5173`.

### 3.3 Default Credentials
- **Email**: `admin@docintel.io`
- **Password**: `AdminPassword123!`
*(Or click "Auto-fill" on the Login screen).*

---

## 4. Platform Verification Workflow
1. **Login** with the Admin account.
2. Navigate to **Upload & Process** (or the Dashboard dropzone) and drag & drop a sample PDF, Word document, Excel spreadsheet, or image.
3. Observe real-time status transitions (`Queued` → `Processing` → `Completed`).
4. Click on the document to open the **Document Intelligence Studio**:
   - Inspect the **Extracted Text** on the left panel.
   - Review **AI Insights** (Classification, Confidence %, Summary, Key Highlights, Key-Value attributes, Recognized Entities, Action Items).
   - Switch to the **Chat with Document** tab and ask questions about specific figures, terms, or obligations.

