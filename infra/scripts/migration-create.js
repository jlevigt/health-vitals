/* eslint-disable no-console */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Configuração para ESM (equivalente ao __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Pega o nome passado como argumento (ex: create_users)
const args = process.argv.slice(2);
const migrationName = args[0];

// Validação básica
if (!migrationName) {
  console.error("❌ Erro: Você deve fornecer um nome para a migration.");
  console.error("👉 Exemplo de uso: npm run migration:create create_users_table");
  process.exit(1);
}

// 2. Cria o Timestamp (Date.now() retorna milissegundos, garantindo ordem cronológica)
const timestamp = Date.now().toString();

// Sanitiza o nome (troca espaços por underlines e remove caracteres especiais) para evitar problemas no SO
const safeName = migrationName
  .toLowerCase()
  .replace(/[^a-z0-9]/g, "_") // Remove tudo que não for letra ou número
  .replace(/_+/g, "_"); // Remove underlines duplicados

const filename = `${timestamp}_${safeName}.sql`;

// 3. Define o caminho da pasta /migrations
// (Assumindo que o script está em /scripts e as migrations em /migrations)
const migrationsDir = path.join(__dirname, "../migrations");

// Garante que a pasta existe (se não existir, cria)
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

const filePath = path.join(migrationsDir, filename);

// 4. Conteúdo padrão do arquivo (Boilerplate)
const content = `-- Migration: ${safeName}
-- Created at: ${new Date().toISOString()}

-- Escreva seu SQL abaixo.
-- Use BEGIN e COMMIT para garantir que a transação seja atômica.

BEGIN;

-- CREATE TABLE ...

COMMIT;
`;

// 5. Cria o arquivo
try {
  fs.writeFileSync(filePath, content);
  console.log("✅ Migration criada com sucesso!");
  console.log(`📄 Arquivo: infra/migrations/${filename}`);
} catch (error) {
  console.error("❌ Erro ao criar arquivo de migration:", error);
  process.exit(1);
}
