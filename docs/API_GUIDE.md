# CrisisDesk AI API Guide

## Base URL

```text
Local:      http://localhost:5000/api
Production: https://crisisdesk-ai-hackathon.onrender.com/api
```

## Authentication

Protected routes require:

```http
Authorization: Bearer <ACCESS_TOKEN>
```

Get the token from `POST /auth/login`. The included Postman collection stores it in `{{adminToken}}`.

## Response envelopes

Success:

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Readable error message.",
    "details": null
  }
}
```

## GET `/health`

Access: Public

```json
{
  "success": true,
  "message": "CrisisDesk AI API is running.",
  "timestamp": "2026-07-13T05:30:00.000Z"
}
```

## POST `/auth/login`

Access: Public, rate-limited

```json
{
  "email": "admin@example.com",
  "password": "secure-password"
}
```

Successful response includes administrator details, `accessToken`, `tokenType`, and `expiresIn`.

Common failures:

- `400 VALIDATION_ERROR`
- `401 INVALID_CREDENTIALS`
- `429 LOGIN_RATE_LIMIT_EXCEEDED`

## GET `/auth/me`

Access: Authenticated administrator

Returns the currently authenticated administrator.

## POST `/reports`

Access: Public, rate-limited

```json
{
  "name": "Rahim",
  "contact": "01712345678",
  "location": "Sylhet Bondor Bazar",
  "description": "A shop is on fire and people may be trapped inside.",
  "language": "en"
}
```

Required:

- `location`
- `description`

Optional:

- `name`
- `contact`
- `language`, default `unknown`

AI-controlled and administrative fields cannot be set by the client.

Successful response: `201 Created`

Important returned fields:

```text
category
urgency
summary
suggestedAction
confidence
possibleDuplicate
duplicateScore
matchedReportId
status
aiStatus
requiresManualReview
```

## GET `/reports`

Access: Authenticated administrator

Supported query parameters:

```text
category
urgency
status
language
search
startDate
endDate
page
limit
sortBy
sortOrder
```

Example:

```http
GET /reports?category=fire&urgency=critical&page=1&limit=10
```

Pagination metadata includes page, limit, total reports, total pages, returned reports, and next/previous-page flags.

## GET `/reports/stats/summary`

Access: Authenticated administrator

Returns:

```text
totalReports
criticalReports
pendingReports
resolvedReports
possibleDuplicateReports
manualReviewReports
categoryBreakdown
urgencyBreakdown
```

## GET `/reports/:id`

Access: Authenticated administrator

Returns the report, matched report, reports linked as duplicates, and status history.

Possible failures:

- `400 VALIDATION_ERROR`
- `404 REPORT_NOT_FOUND`

## PATCH `/reports/:id/status`

Access: Authenticated administrator

```json
{
  "status": "assigned"
}
```

Allowed statuses:

```text
pending
in_review
assigned
resolved
rejected
```

A successful update creates a status-history row tied to the authenticated administrator.

Possible failures:

- `400 VALIDATION_ERROR`
- `404 REPORT_NOT_FOUND`
- `409 STATUS_UNCHANGED`

## DELETE `/reports/:id`

Access: `super_admin`

Successful response:

```json
{
  "success": true,
  "message": "Report deleted successfully.",
  "data": null
}
```

Possible failures:

- `401 AUTHENTICATION_REQUIRED`
- `403 INSUFFICIENT_PERMISSION`
- `404 REPORT_NOT_FOUND`

## Postman setup

Set the collection variable:

```text
baseUrl = http://localhost:5000
```

or:

```text
baseUrl = https://crisisdesk-ai-hackathon.onrender.com
```

The login post-response script should save the token:

```javascript
const responseBody = pm.response.json();

if (pm.response.code === 200 && responseBody?.data?.accessToken) {
  pm.collectionVariables.set(
    "adminToken",
    responseBody.data.accessToken
  );
}
```

Recommended execution order:

1. Health
2. Login
3. Current administrator
4. Submit original report
5. Submit paraphrased duplicate
6. List reports
7. Get report
8. Update status
9. Analytics
10. Delete report
