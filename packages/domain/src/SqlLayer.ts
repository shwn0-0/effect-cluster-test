import { PgClient } from "@effect/sql-pg";
import { Config } from "effect";

export const Live = PgClient.layerConfig({
  url: Config.redacted("DB_URL"),
});
