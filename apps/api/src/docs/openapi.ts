import {
  authenticateUserSchema,
  authUserSummarySchema,
  ConfirmUploadBodySchema,
  confirmUploadResponseSchema,
  createUserSchema,
  dashboardCategorySchema,
  dashboardResponseSchema,
  deleteFileResponseSchema,
  FileStatusSchema,
  FileUploadItemSchema,
  fileListItemSchema,
  fileUploadUrlResponseSchema,
  ListFilesQuerySchema,
  listFilesResponseSchema,
  listObservationsResponseSchema,
  listReportsResponseSchema,
  loginResponseSchema,
  messageResponseSchema,
  observationSchema,
  passwordChangeSchema,
  passwordRecoveryRequestSchema,
  passwordResetSchema,
  RequestUploadBodySchema,
  refreshResponseSchema,
  reportSchema,
  requestUploadResponseSchema,
  trendPointSchema,
  trendSeriesSchema,
  verifyEmailSchema,
} from "@health-vitals/contracts";
import { z } from "zod";

type JsonObject = Record<string, unknown>;

const healthDependencyStatusSchema = z.enum(["connected", "disconnected"]);

const healthCheckResponseSchema = z.object({
  uptime: z.number(),
  message: z.enum(["OK", "DEGRADED"]),
  timestamp: z.number().int(),
  db: healthDependencyStatusSchema,
  storage: healthDependencyStatusSchema,
  queue: healthDependencyStatusSchema,
  memory: z.object({
    rss: z.number(),
    heapTotal: z.number(),
    heapUsed: z.number(),
    external: z.number(),
    arrayBuffers: z.number(),
  }),
});

const errorResponseSchema = z.object({
  message: z.string(),
});

const validationErrorResponseSchema = z.object({
  message: z.literal("Validation error"),
  issues: z.array(
    z.object({
      path: z.string(),
      message: z.string(),
    }),
  ),
});

function toOpenApiSchema(schema: z.ZodType): JsonObject {
  const jsonSchema = z.toJSONSchema(schema, { target: "openapi-3.0" }) as JsonObject;
  const { $schema: _unusedSchema, ...rest } = jsonSchema;
  return rest;
}

function schemaRef(name: string): JsonObject {
  return { $ref: `#/components/schemas/${name}` };
}

function jsonContent(schema: JsonObject, example?: unknown): JsonObject {
  return {
    "application/json": {
      schema,
      ...(example !== undefined ? { example } : {}),
    },
  };
}

function errorResponse(description: string, schemaName = "ErrorResponse"): JsonObject {
  return {
    description,
    content: jsonContent(schemaRef(schemaName)),
  };
}

export function buildOpenApiDocument(): JsonObject {
  return {
    openapi: "3.0.3",
    info: {
      title: "Health Vitals API",
      version: "1.0.0",
      description:
        "REST API for managing user authentication, direct-to-storage clinical lab report PDF uploads, extracted clinical reports, and biomarker trend dashboards. Schemas are generated directly from @health-vitals/contracts Zod definitions.",
    },
    servers: [
      {
        url: "https://api.binderlex.com",
        description: "Production (Fly.io)",
      },
      {
        url: "http://localhost:3000",
        description: "Local development server",
      },
    ],
    tags: [
      { name: "System", description: "Service health and readiness probes" },
      {
        name: "Auth",
        description: "User registration, email verification, sessions, and passwords",
      },
      { name: "Files", description: "Presigned PDF upload lifecycle and file management" },
      { name: "Reports", description: "Extracted clinical lab reports and biomarker observations" },
      { name: "Dashboard", description: "Time-series clinical biomarker trends by category" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Short-lived JWT access token returned by POST /auth/login or POST /auth/refresh.",
        },
        refreshCookie: {
          type: "apiKey",
          in: "cookie",
          name: "refreshToken",
          description: "HttpOnly SameSite=Strict session refresh token scoped to /auth.",
        },
      },
      schemas: {
        // System & Errors
        HealthCheckResponse: toOpenApiSchema(healthCheckResponseSchema),
        ErrorResponse: toOpenApiSchema(errorResponseSchema),
        ValidationErrorResponse: toOpenApiSchema(validationErrorResponseSchema),

        // Auth
        CreateUserRequest: toOpenApiSchema(createUserSchema),
        AuthenticateUserRequest: toOpenApiSchema(authenticateUserSchema),
        VerifyEmailRequest: toOpenApiSchema(verifyEmailSchema),
        PasswordRecoveryRequest: toOpenApiSchema(passwordRecoveryRequestSchema),
        PasswordResetRequest: toOpenApiSchema(passwordResetSchema),
        PasswordChangeRequest: toOpenApiSchema(passwordChangeSchema),
        AuthUserSummary: toOpenApiSchema(authUserSummarySchema),
        LoginResponse: toOpenApiSchema(loginResponseSchema),
        RefreshResponse: toOpenApiSchema(refreshResponseSchema),
        MessageResponse: toOpenApiSchema(messageResponseSchema),

        // Files
        FileStatus: toOpenApiSchema(FileStatusSchema),
        FileUploadItem: toOpenApiSchema(FileUploadItemSchema),
        RequestUploadBody: toOpenApiSchema(RequestUploadBodySchema),
        ConfirmUploadBody: toOpenApiSchema(ConfirmUploadBodySchema),
        ListFilesQuery: toOpenApiSchema(ListFilesQuerySchema),
        FileUploadUrlResponse: toOpenApiSchema(fileUploadUrlResponseSchema),
        RequestUploadResponse: toOpenApiSchema(requestUploadResponseSchema),
        ConfirmUploadResponse: toOpenApiSchema(confirmUploadResponseSchema),
        FileListItem: toOpenApiSchema(fileListItemSchema),
        ListFilesResponse: toOpenApiSchema(listFilesResponseSchema),
        DeleteFileResponse: toOpenApiSchema(deleteFileResponseSchema),

        // Reports & Dashboard
        Report: toOpenApiSchema(reportSchema),
        Observation: toOpenApiSchema(observationSchema),
        ListReportsResponse: toOpenApiSchema(listReportsResponseSchema),
        ListObservationsResponse: toOpenApiSchema(listObservationsResponseSchema),
        DashboardCategory: toOpenApiSchema(dashboardCategorySchema),
        TrendPoint: toOpenApiSchema(trendPointSchema),
        TrendSeries: toOpenApiSchema(trendSeriesSchema),
        DashboardResponse: toOpenApiSchema(dashboardResponseSchema),
      },
    },
    paths: {
      "/health": {
        get: {
          tags: ["System"],
          summary: "Deep health check",
          description:
            "Actively verifies connectivity to PostgreSQL, S3-compatible object storage, and RabbitMQ. Returns 503 if any critical dependency is degraded.",
          responses: {
            "200": {
              description: "All critical dependencies are connected",
              content: jsonContent(schemaRef("HealthCheckResponse"), {
                uptime: 124.5,
                message: "OK",
                timestamp: 1769100000000,
                db: "connected",
                storage: "connected",
                queue: "connected",
                memory: {
                  rss: 85000000,
                  heapTotal: 32000000,
                  heapUsed: 21000000,
                  external: 2400000,
                  arrayBuffers: 120000,
                },
              }),
            },
            "503": {
              description: "One or more critical dependencies are disconnected",
              content: jsonContent(schemaRef("HealthCheckResponse")),
            },
          },
        },
      },

      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          description:
            "Creates an inactive user account, stores a hashed verification token, and dispatches a verification email via the configured MailProvider.",
          requestBody: {
            required: true,
            content: jsonContent(schemaRef("CreateUserRequest"), {
              email: "patient@example.com",
              password: "strong-password-123",
            }),
          },
          responses: {
            "201": {
              description: "User registered and verification email dispatched",
              content: jsonContent(schemaRef("AuthUserSummary"), {
                id: "550e8400-e29b-41d4-a716-446655440000",
                email: "patient@example.com",
              }),
            },
            "400": errorResponse("Validation error or duplicate email", "ValidationErrorResponse"),
            "500": errorResponse("Internal server error"),
          },
        },
      },

      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Authenticate user",
          description:
            "Validates credentials via Argon2, issues a 15-minute JWT access token in the response body, and sets a 7-day HttpOnly refreshToken cookie scoped to /auth.",
          requestBody: {
            required: true,
            content: jsonContent(schemaRef("AuthenticateUserRequest"), {
              email: "patient@example.com",
              password: "strong-password-123",
            }),
          },
          responses: {
            "200": {
              description: "Authenticated successfully",
              headers: {
                "Set-Cookie": {
                  description:
                    "HttpOnly SameSite=Strict refreshToken cookie (path=/auth, maxAge=7d)",
                  schema: { type: "string" },
                },
              },
              content: jsonContent(schemaRef("LoginResponse")),
            },
            "400": errorResponse("Validation error", "ValidationErrorResponse"),
            "401": errorResponse("Invalid credentials"),
            "403": errorResponse("User email has not been verified"),
          },
        },
      },

      "/auth/verify-email": {
        get: {
          tags: ["Auth"],
          summary: "Verify email address (query parameters)",
          description:
            "Activates a user account using the token and email parameters from the verification email link.",
          parameters: [
            {
              name: "email",
              in: "query",
              required: true,
              schema: { type: "string", format: "email" },
              example: "patient@example.com",
            },
            {
              name: "token",
              in: "query",
              required: true,
              schema: { type: "string", minLength: 1 },
            },
          ],
          responses: {
            "200": {
              description: "Email verified (or already active)",
              content: jsonContent(schemaRef("MessageResponse"), {
                message: "Email verified successfully",
              }),
            },
            "400": errorResponse("Invalid, missing, or expired verification token"),
          },
        },
        post: {
          tags: ["Auth"],
          summary: "Verify email address (JSON body)",
          description: "Activates a user account by submitting email and token in a JSON payload.",
          requestBody: {
            required: true,
            content: jsonContent(schemaRef("VerifyEmailRequest"), {
              email: "patient@example.com",
              token: "verification-token-hex",
            }),
          },
          responses: {
            "200": {
              description: "Email verified (or already active)",
              content: jsonContent(schemaRef("MessageResponse"), {
                message: "Email verified successfully",
              }),
            },
            "400": errorResponse("Invalid, missing, or expired verification token"),
          },
        },
      },

      "/auth/refresh": {
        post: {
          tags: ["Auth"],
          summary: "Rotate refresh token and issue new access token",
          description:
            "Reads the HttpOnly refreshToken cookie, validates the session record, rotates the refresh token cookie, and returns a new JWT access token.",
          security: [{ refreshCookie: [] }],
          responses: {
            "200": {
              description: "New access token issued and refreshToken cookie rotated",
              content: jsonContent(schemaRef("RefreshResponse")),
            },
            "401": errorResponse("Refresh token missing, invalid, or expired"),
          },
        },
      },

      "/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Invalidate current session and clear cookie",
          security: [{ refreshCookie: [] }],
          responses: {
            "200": {
              description: "Session revoked and refreshToken cookie cleared",
              content: jsonContent(schemaRef("MessageResponse"), {
                message: "Logged out successfully",
              }),
            },
          },
        },
      },

      "/auth/password/recovery/request": {
        post: {
          tags: ["Auth"],
          summary: "Request password recovery email",
          description:
            "Always returns a generic success message to prevent account enumeration; sends a recovery email when a matching account exists.",
          requestBody: {
            required: true,
            content: jsonContent(schemaRef("PasswordRecoveryRequest"), {
              email: "patient@example.com",
            }),
          },
          responses: {
            "200": {
              description: "Recovery request accepted",
              content: jsonContent(schemaRef("MessageResponse"), {
                message: "If an account exists with that email, a recovery link has been sent.",
              }),
            },
            "400": errorResponse("Validation error", "ValidationErrorResponse"),
          },
        },
      },

      "/auth/password/reset": {
        post: {
          tags: ["Auth"],
          summary: "Reset password with recovery token",
          description:
            "Validates the hashed recovery token, updates the Argon2 password hash, and revokes active sessions.",
          requestBody: {
            required: true,
            content: jsonContent(schemaRef("PasswordResetRequest")),
          },
          responses: {
            "200": {
              description: "Password reset successfully",
              content: jsonContent(schemaRef("MessageResponse"), {
                message: "Password reset successfully.",
              }),
            },
            "400": errorResponse("Invalid or expired recovery token"),
          },
        },
      },

      "/auth/password/change": {
        post: {
          tags: ["Auth"],
          summary: "Change password for authenticated user",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: jsonContent(schemaRef("PasswordChangeRequest")),
          },
          responses: {
            "200": {
              description: "Password changed successfully",
              content: jsonContent(schemaRef("MessageResponse"), {
                message: "Password changed successfully.",
              }),
            },
            "400": errorResponse("Validation error", "ValidationErrorResponse"),
            "401": errorResponse("Authentication required or current password incorrect"),
          },
        },
      },

      "/files/uploads": {
        post: {
          tags: ["Files"],
          summary: "Request presigned upload URLs",
          description:
            "Creates file metadata rows in CREATED status and returns time-limited S3 presigned PUT URLs so clients upload PDFs directly to object storage.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: jsonContent(schemaRef("RequestUploadBody"), {
              files: [
                {
                  original_filename: "lab-report-2026-01.pdf",
                  size_bytes: 524288,
                  content_type: "application/pdf",
                },
              ],
            }),
          },
          responses: {
            "201": {
              description: "Presigned upload URLs created",
              content: jsonContent(schemaRef("RequestUploadResponse")),
            },
            "400": errorResponse("Invalid request body"),
            "401": errorResponse("Unauthorized"),
          },
        },
      },

      "/files/{file_id}/upload-complete": {
        post: {
          tags: ["Files"],
          summary: "Confirm direct upload and enqueue extraction",
          description:
            "Transitions the file record from CREATED to QUEUED and publishes a FileProcessJobPayload message to the RabbitMQ file_processing queue.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "file_id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          requestBody: {
            required: false,
            content: jsonContent(schemaRef("ConfirmUploadBody"), {
              etag: '"d41d8cd98f00b204e9800998ecf8427e"',
            }),
          },
          responses: {
            "200": {
              description: "File queued for asynchronous worker extraction",
              content: jsonContent(schemaRef("ConfirmUploadResponse"), {
                file_id: "550e8400-e29b-41d4-a716-446655440000",
                status: "QUEUED",
              }),
            },
            "400": errorResponse("Invalid file ID or body"),
            "401": errorResponse("Unauthorized"),
            "404": errorResponse("File not found"),
          },
        },
      },

      "/files": {
        get: {
          tags: ["Files"],
          summary: "List authenticated user's uploaded files",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "status",
              in: "query",
              required: false,
              description: "Optional FileStatus filter",
              schema: schemaRef("FileStatus"),
            },
          ],
          responses: {
            "200": {
              description: "List of uploaded files",
              content: jsonContent(schemaRef("ListFilesResponse")),
            },
            "400": errorResponse("Invalid status filter"),
            "401": errorResponse("Unauthorized"),
          },
        },
      },

      "/files/{file_id}": {
        delete: {
          tags: ["Files"],
          summary: "Delete an uploaded file and cascaded clinical records",
          description:
            "Deletes the file record (cascading to reports, observations, and llm_requests) and removes the corresponding object from S3-compatible storage.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "file_id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            "200": {
              description: "File deleted",
              content: jsonContent(schemaRef("DeleteFileResponse"), {
                file_id: "550e8400-e29b-41d4-a716-446655440000",
                deleted: true,
              }),
            },
            "400": errorResponse("Invalid file ID"),
            "401": errorResponse("Unauthorized"),
            "404": errorResponse("File not found"),
          },
        },
      },

      "/reports": {
        get: {
          tags: ["Reports"],
          summary: "List extracted clinical reports",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "Array of clinical reports for the authenticated user",
              content: jsonContent(schemaRef("ListReportsResponse")),
            },
            "401": errorResponse("Unauthorized"),
          },
        },
      },

      "/reports/{id}/observations": {
        get: {
          tags: ["Reports"],
          summary: "List biomarker observations for a report",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Report UUID",
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            "200": {
              description: "Array of clinical observations for the report",
              content: jsonContent(schemaRef("ListObservationsResponse")),
            },
            "401": errorResponse("Unauthorized"),
            "404": errorResponse("Report not found"),
          },
        },
      },

      "/dashboard/{category}": {
        get: {
          tags: ["Dashboard"],
          summary: "Get biomarker time-series trends for a category",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "category",
              in: "path",
              required: true,
              description: "Clinical biomarker category",
              schema: schemaRef("DashboardCategory"),
            },
          ],
          responses: {
            "200": {
              description: "Time-series trend data grouped by canonical biomarker name",
              content: jsonContent(schemaRef("DashboardResponse")),
            },
            "400": errorResponse("Invalid category"),
            "401": errorResponse("Unauthorized"),
          },
        },
      },
    },
  };
}
