import type { Database, Logger } from "@health-vitals/infra";
import { FileListItem, ListFilesQuery } from "../types.ts";

export class ListFilesService {
  constructor(
    private db: Database,
    private logger: Logger
  ) {}

  async execute(
    userId: string,
    query: ListFilesQuery
  ): Promise<FileListItem[]> {
    this.logger.debug(`Listing files for user ${userId}`, { query });

    let sql = `
      SELECT id, original_filename, status, created_at, processed_at
      FROM files
      WHERE user_id = $1
    `;
    const params: (string | undefined)[] = [userId];

    if (query.status) {
      sql += ` AND status = $2`;
      params.push(query.status);
    }

    sql += ` ORDER BY created_at DESC LIMIT 100`;

    const result = await this.db.query(sql, params);

    return result.rows.map((row) => ({
      id: row.id,
      filename: row.original_filename,
      status: row.status,
      created_at: row.created_at.toISOString(),
      processed_at: row.processed_at?.toISOString() ?? null,
    }));
  }
}
