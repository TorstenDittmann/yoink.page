import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core'

export const conversions = sqliteTable('conversions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  htmlOutput: text('html_output').notNull(),
  imagePreview: text('image_preview'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

export const usage = sqliteTable('usage', {
  userId: text('user_id').notNull(),
  date: text('date').notNull(),
  count: integer('count').default(0)
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.date] })
  }
})
