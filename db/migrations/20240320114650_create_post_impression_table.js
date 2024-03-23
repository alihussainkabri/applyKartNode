/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('post_impressions',function(table){
    table.bigIncrements('id')
    table.string('post_id')
    table.string('action')
    table.string('comment')
    table.string('created_by')
    table.dateTime('created_datetime')
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('post_impressions')
};
