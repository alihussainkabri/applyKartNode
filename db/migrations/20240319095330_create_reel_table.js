/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('reels',function(table){
    table.bigIncrements('id')
    table.string('type')
    table.string('media')
    table.string('created_by')
    table.string('preview_image')
    table.dateTime('created_at')
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('reels')
};
