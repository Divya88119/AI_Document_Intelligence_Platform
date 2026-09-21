# AI Document Intelligence Platform — REST API Reference

All requests to protected endpoints require a JWT Bearer token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Authentication & User Management

### `POST /api/Users/login`
Authenticates user and returns JWT token.
- **Access**: Public / Anonymous
- **Request Body**:
```json
{
  "email": "admin@docintel.io",
  "password": "AdminPassword123!"
}
```
- **Response `200 OK`**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5c...",
  "expiration": "2026-09-01T17:00:00Z",
  "userId": 1,
  "fullName": "System Administrator",
  "email": "admin@docintel.io",
  "role": "Admin"
}
```

### `GET /api/Users`
Retrieves all active users.
- **Access**: `Admin` only
- **Response `200 OK`**: Array of `UserResponseDto`.

### `POST /api/Users`
Creates a new user.
- **Access**: `Admin` only
- **Request Body**:
```json
{
  "fullName": "Jane Doe",
  "email": "jane@company.com",
  "password": "Password123!"
}
```

### `PUT /api/Users/{id}`
Updates an existing user.
- **Access**: `Admin` only

### `DELETE /api/Users/{id}`
Soft-deletes a user.
- **Access**: `Admin` only

---

## 2. Document Management

### `POST /api/Documents`
Uploads a document file for asynchronous AI extraction.
- **Content-Type**: `multipart/form-data`
- **Form Data**: `file` (Binary file, e.g. `.pdf`, `.docx`, `.xlsx`, `.png`, `.jpg`, `.txt`)
- **Response `201 Created`**:
```json
{
  "id": 12,
  "fileName": "Invoice_Q3_AcmeCorp.pdf",
  "contentType": "application/pdf",
  "fileSizeBytes": 154820,
  "processingStatus": "Queued",
  "uploadedAt": "2026-09-01T15:00:00Z",
  "uploadedByUserId": 1
}
```

### `GET /api/Documents`
Returns a list of documents. Admins see all documents; regular users see only their own.
- **Response `200 OK`**: Array of `DocumentResponseDto`.

### `GET /api/Documents/{id}`
Returns complete document details including extracted text and AI insights.
- **Response `200 OK`**:
```json
{
  "id": 12,
  "fileName": "Invoice_Q3_AcmeCorp.pdf",
  "contentType": "application/pdf",
  "fileSizeBytes": 154820,
  "processingStatus": "Completed",
  "uploadedAt": "2026-09-01T15:00:00Z",
  "uploadedByUserId": 1,
  "uploadedByUserName": "System Administrator",
  "extractedContent": {
    "documentId": 12,
    "rawText": "Invoice # INV-2026-081\nDate: 2026-08-15\n...",
    "pageCount": 2,
    "wordCount": 420,
    "extractedAt": "2026-09-01T15:00:02Z"
  },
  "insight": {
    "id": 8,
    "documentId": 12,
    "category": "Invoice / Billing",
    "confidenceScore": 0.96,
    "executiveSummary": "This invoice from Acme Corp details services rendered in Q3...",
    "keyHighlights": ["Total amount due: $12,500.00", "Payment due by Sept 15, 2026"],
    "keyValues": {
      "Invoice Number": "INV-2026-081",
      "Total Amount": "$12,500.00",
      "Due Date": "2026-09-15"
    },
    "entities": [
      { "type": "Organization", "value": "Acme Corp" },
      { "type": "Amount", "value": "$12,500.00" }
    ],
    "actionItems": ["Verify line items against Purchase Order PO-991"],
    "aiModelUsed": "Built-in Intelligence Engine",
    "processedAt": "2026-09-01T15:00:03Z"
  }
}
```

### `GET /api/Documents/{id}/download`
Downloads the original document binary file with appropriate MIME headers.

### `DELETE /api/Documents/{id}`
Deletes the document, its physical disk file, and all associated AI insights/chat history.

### `POST /api/Documents/{id}/reprocess`
Re-queues the document for extraction and AI analysis.

---

## 3. Interactive Document Q&A / Chat

### `GET /api/Documents/{documentId}/chat`
Retrieves multi-turn conversation history for the specified document.

### `POST /api/Documents/{documentId}/chat`
Submits a user prompt/question to be answered grounded strictly in the document context.
- **Request Body**:
```json
{
  "message": "What is the payment due date and total amount?"
}
```
- **Response `200 OK`**:
```json
{
  "id": 45,
  "documentId": 12,
  "userId": 1,
  "userName": "AI Assistant",
  "role": "assistant",
  "message": "Based on the document, the payment due date is September 15, 2026, and the total amount due is $12,500.00.",
  "timestamp": "2026-09-01T15:05:00Z"
}
```

---

## 4. Dashboard & Analytics

### `GET /api/Dashboard/stats`
Returns aggregated telemetry: total document counts, status breakdown, storage volume, category distribution, and recent uploads.

