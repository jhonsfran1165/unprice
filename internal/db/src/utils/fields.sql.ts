import { bigint, customType, varchar } from "drizzle-orm/pg-core"
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

// Define your encryption key and initialization vector (IV)
const ENCRYPTION_KEY = randomBytes(32) // 256-bit key
const IV = randomBytes(16) // 128-bit IV

// Define the custom type for encrypted fields
export const encrypted = customType<{ data: string; notNull: true; default: false }>({
  dataType() {
    return "text" // Store the encrypted data as text in the database
  },
  fromDriver(value: unknown) {
    // Decrypt the value when reading from the database
    const decipher = createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, IV)
    let decrypted = decipher.update(String(value), "hex", "utf8")
    decrypted += decipher.final("utf8")
    return decrypted
  },
  toDriver(value: string) {
    // Encrypt the value before writing to the database
    const cipher = createCipheriv("aes-256-cbc", ENCRYPTION_KEY, IV)
    let encrypted = cipher.update(value, "utf8", "hex")
    encrypted += cipher.final("hex")
    return encrypted
  },
})

// easier to migrate to another db
export const cuid = (d: string) => varchar(d, { length: 36 })

// for workspace
export const id = {
  id: cuid("id").primaryKey().notNull(),
}

// for projects
export const workspaceID = {
  workspaceId: cuid("workspace_id").notNull(),
}

// common timestamps for all tables
// all dates are in UTC
export const timestamps = {
  createdAtM: bigint("created_at_m", { mode: "number" })
    .notNull()
    .default(0)
    .$defaultFn(() => Date.now()),
  updatedAtM: bigint("updated_at_m", { mode: "number" })
    .notNull()
    .default(0)
    .$defaultFn(() => Date.now())
    .$onUpdateFn(() => Date.now()),

  // createdAtM: timestamp("created_at", {
  //   mode: "date",
  //   withTimezone: true,
  //   precision: 3,
  // })
  //   .notNull()
  //   .default(sql`CURRENT_TIMESTAMP AT TIME ZONE 'UTC'`)
  //   .defaultNow(),
  // updatedAtM: timestamp("updated_at", {
  //   mode: "date",
  //   withTimezone: true,
  //   precision: 3,
  // })
  //   .notNull()
  //   .default(sql`CURRENT_TIMESTAMP AT TIME ZONE 'UTC'`)
  //   .defaultNow()
  //   .$onUpdateFn(() => {
  //     // convert to utc
  //     const date = new Date()
  //     // Extract date components
  //     const year = date.getFullYear()
  //     const month = date.getMonth()
  //     const day = date.getDate()
  //     const hours = date.getHours()
  //     const minutes = date.getMinutes()
  //     const seconds = date.getSeconds()
  //     const milliseconds = date.getMilliseconds()

  //     // Create a new UTC date with the same components, including milliseconds
  //     const utcDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds, milliseconds))
  //     return utcDate
  //   }),
}
