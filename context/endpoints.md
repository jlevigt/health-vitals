
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/refresh
POST /auth/verify-email

POST /auth/password/recovery/request
POST /auth/password/recovery/reset
POST /auth/password/change

---

Client request signed URL to upload one or more files to storage, each file must have a key
POST /files/uploads
{
  "files": [
    {
      "original_filename": "exam_2022_01.pdf",
      "size_bytes": 496123,
      "content_type": "application/pdf"
    },
    {
      "original_filename": "exam_2022_06.pdf",
      "size_bytes": 512883,
      "content_type": "application/pdf"
    }
  ]
}

{
  "files": [
    {
      "file_id": "uuid",
      "object_key": "uploads/{user_id}/{file_id}.pdf",
      "upload_url": "https://storage/...",
      "expires_at": "2026-01-20T19:00:00Z"
    }
  ]
}

Client send upload completed message per file
POST /files/{file_id}/upload-complete

{
  "etag": "optional",
  "checksum": "optional"
}

{
  "file_id": "uuid",
  "status": "QUEUED"
}


GET /files
GET /files?status=QUEUED
GET /files?status=FAILED_RETRYABLE

[
  {
    "id": "uuid",
    "original_filename": "exam_2022_01.pdf",
    "status": "PROCESSING",
    "created_at": "...",
    "processed_at": null
  }
]


GET /reports

[
  {
    "id": "uuid",
    "file_id": "uuid",
    "collection_date": "2022-01-10",
    "lab_name": "Lab X"
  }
]


GET /reports/:id/observations
{
  "report_id": "uuid",
  "observations": [
    {
      "category": "lipid_panel",
      "canonical_name": "hdl_cholesterol",
      "value": 42,
      "unit": "mg_dl",
      "reference": {
        "low": 40,
        "high": 60
      }
    }
  ]
}


GET /dashboards/:category

{
  "category": "lipid_panel",
  "series": [
    {
      "canonical_name": "hdl_cholesterol",
      "points": [
        { "date": "2022-01-10", "value": 42 },
        { "date": "2022-06-10", "value": 45 }
      ]
    }
  ]
}
