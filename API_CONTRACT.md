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

## Ideathon Events (FR-IE)

All event routes require authentication. **Admin** routes additionally require the `admin` role (403 otherwise).

### Employee-facing

| Method | Path | Notes |
|---|---|---|
| GET | `/api/events/explore` | Visible events (excludes drafts; `restricted` only when the caller's department is targeted). Filters: `status`, `type`, `initiative`, `category` — the last three accept comma-separated multi-select values (FR-IE-04). |
| GET | `/api/events/facets` | Distinct `initiatives` and `categories` visible to the caller — powers the multi-select filter options. |
| GET | `/api/events/mine` | Events the caller has registered for ("My Events", FR-IE-03). |
| GET | `/api/events/:id` | Event detail. Drafts and out-of-department restricted events return 403. |
| GET | `/api/events/:id/leaderboard` | Ideas linked to the event, ranked by average evaluator score. |
| POST | `/api/events/:id/join` | Register for an active event. Idempotent (re-join returns 200 with `already joined`). Sends a join-confirmation notification (FR-IE-03). Rejected for closed events or when `maxParticipants` is reached. |

### Admin-facing

| Method | Path | Notes |
|---|---|---|
| GET | `/api/events` | List all events, including drafts; participants and `createdBy` are populated. |
| POST | `/api/events` | Create (FR-IE-01). Required: `eventName`, `eventType`, `startDate`, `endDate` (end ≥ start). Optional: `theme`, `description`, `initiative`, `targetDepartments`, `maxParticipants`, `ideaCategory`, `visibility`, `status`, `minQualifyingScore`, `quorumType`, `quorumValue`. |
| PATCH | `/api/events/:id` | Update the same fields (FR-IE-01/02). |
| POST | `/api/events/:id/extend` | Extend the deadline. Requires `newEndDate` and a `justification` of **≥ 20 characters**; notified to all registered participants and recorded in `extensionHistory` (FR-IE-07). |
| POST | `/api/events/:id/close` | Close the event (FR-AD-03). Idempotent. |

**Submitting an idea to a closed event (FR-IE-06):** `POST /api/ideas` and `POST /api/ideas/:id/submit` return **400/422** when the linked event is not `active`/`extended` or its `endDate` has passed. The submission form blocks this client-side and shows a banner.

**Visibility values:** `published` (all), `restricted` (target departments only), `draft` (admin only — never returned by `/explore`, even when `status=draft` is requested).
**Status values:** `draft`, `active`, `extended`, `closed`.

## Versioning Policy
Current routes are under `/api/`. 
Moving forward, external integrations and major breaking structural changes will be introduced under `/api/v1/` to protect existing UI consumption.
