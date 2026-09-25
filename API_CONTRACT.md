# IdeaHub API Contract

## Base URLs
- **Development**: `http://localhost:5000/api`
- **Production**: Defined by deployment environment.

## Authentication
Most routes require an `Authorization: Bearer <accessToken>` header.
Tokens are short-lived. A silent refresh is executed against `POST /api/auth/refresh` sending an `httpOnly` cookie to retrieve a new token.

## Standard Error Response
All errors return a standard JSON structure with the appropriate HTTP status code (400, 401, 403, 404, 409, 422, 500).

```json
{
  "success": false,
  "message": "Human readable error description",
  "requestId": "uuid-v4-correlation-id",
  "errors": [
    { "field": "propertyName", "message": "Field specific validation error" }
  ]
}
```

## Standard Success Response
All successful responses return a `200` or `201` HTTP status code.

```json
{
  "success": true,
  "data": { ... } // Or an array [...]
}
```

## Observability & Correlation
- All requests return an `x-request-id` header.
- The `x-request-id` is included in error responses (`requestId`) for easier support tracing.
- If a client sends an `x-request-id` header, the server will adopt it for distributed tracing.

## Pagination
List endpoints (e.g. `/api/ideas`, `/api/notifications`) accept `page` and `limit` query parameters.

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "ideas": [...],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 10,
      "pages": 15
    }
  }
}
```

## Uploads (Multipart Form Data)
Endpoints accepting files must use `multipart/form-data`.
- Maximum file size is typically 5MB.
- Only safe mime-types and extensions are allowed (pdf, doc, docx, png, jpg, jpeg, csv, xlsx, pptx, zip).
- Files are content-sniffed (magic bytes verification).

## Versioning Policy
Current routes are under `/api/`. 
Moving forward, external integrations and major breaking structural changes will be introduced under `/api/v1/` to protect existing UI consumption.
