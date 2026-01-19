/* eslint-disable no-console */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { fileURLToPath } from "node:url";

// Configuração para ler diretórios em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente (assumindo que você já carregou via dotenv no comando de execução)
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log("🔄 Iniciando migrações...");

    // 1. Iniciar Transação
    await client.query("BEGIN");

    // 2. Advisory Lock (ID arbitrário 123456789)
    // Isso impede que múltiplos containers rodem migrations ao mesmo tempo
    await client.query("SELECT pg_advisory_xact_lock(123456789)");

    // 3. Criar tabela de controle se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        run_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 4. Ler quais já foram rodadas
    const { rows: appliedMigrations } = await client.query("SELECT name FROM migrations");
    const appliedNames = new Set(appliedMigrations.map((row) => row.name));

    // 5. Ler arquivos da pasta
    const migrationsDir = path.join(__dirname, "../migrations");
    const files = fs.readdirSync(migrationsDir).sort(); // Garante ordem alfabética/numérica

    // 6. Loop de execução
    for (const file of files) {
      if (!appliedNames.has(file)) {
        console.log(`🚀 Executando: ${file}`);

        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, "utf-8");

        // Executa o SQL da migração
        await client.query(sql);

        // Registra que foi feita
        await client.query("INSERT INTO migrations (name) VALUES ($1)", [file]);
      }
    }

    // 7. Commit Final
    await client.query("COMMIT");
    console.log("✅ Migrações concluídas com sucesso!");
  } catch (error) {
    // Rollback em caso de erro (tudo ou nada)
    await client.query("ROLLBACK");
    console.error("❌ Erro na migração (Rollback executado):", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
