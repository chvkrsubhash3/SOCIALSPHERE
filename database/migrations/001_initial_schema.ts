import { Knex } from 'knex';

// ═══════════════════════════════════════════════════════════════
//              SOCIALSPHERE — DATABASE MIGRATIONS
//        Complete schema for all social media features
// ═══════════════════════════════════════════════════════════════

export async function up(knex: Knex): Promise<void> {
  // ─────────────────────────────────────────────
  // USERS
  // ─────────────────────────────────────────────
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('username', 50).notNullable().unique();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 512).notNullable();
    table.string('display_name', 100);
    table.text('bio');
    table.string('avatar_url', 500);
    table.string('cover_url', 500);
    table.string('website', 200);
    table.string('location', 100);
    table.date('date_of_birth');
    table.string('phone', 20);
    table.enum('role', ['user', 'moderator', 'admin', 'superadmin']).defaultTo('user');
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_verified').defaultTo(false);
    table.boolean('is_private').defaultTo(false);
    table.string('verification_token', 256);
    table.string('theme', 50).defaultTo('default');
    table.text('notification_template');
    table.jsonb('privacy_settings').defaultTo('{}');
    table.string('last_login_ip', 45);
    table.timestamp('last_login_at');
    table.timestamps(true, true);

    table.index(['username']);
    table.index(['email']);
    table.index(['role']);
    table.index(['is_active']);
  });

  // ─────────────────────────────────────────────
  // USER COINS
  // ─────────────────────────────────────────────
  await knex.schema.createTable('user_coins', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.decimal('balance', 20, 2).defaultTo(0);
    table.timestamps(true, true);

    table.unique(['user_id']);
  });

  // ─────────────────────────────────────────────
  // FOLLOWS
  // ─────────────────────────────────────────────
  await knex.schema.createTable('follows', (table) => {
    table.increments('id').primary();
    table.integer('follower_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('following_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['follower_id', 'following_id']);
    table.index(['follower_id']);
    table.index(['following_id']);
  });

  // ─────────────────────────────────────────────
  // POSTS
  // ─────────────────────────────────────────────
  await knex.schema.createTable('posts', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('content').notNullable();
    table.jsonb('media_urls').defaultTo('[]');
    table.enum('privacy', ['public', 'followers', 'private']).defaultTo('public');
    table.integer('likes_count').defaultTo(0);
    table.integer('comments_count').defaultTo(0);
    table.integer('shares_count').defaultTo(0);
    table.integer('parent_post_id').references('id').inTable('posts');
    table.boolean('is_pinned').defaultTo(false);
    table.timestamps(true, true);

    table.index(['user_id']);
    table.index(['privacy']);
    table.index(['created_at']);
  });

  // ─────────────────────────────────────────────
  // COMMENTS
  // ─────────────────────────────────────────────
  await knex.schema.createTable('comments', (table) => {
    table.increments('id').primary();
    table.integer('post_id').notNullable().references('id').inTable('posts').onDelete('CASCADE');
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('content').notNullable();
    table.integer('parent_comment_id').references('id').inTable('comments');
    table.integer('likes_count').defaultTo(0);
    table.timestamps(true, true);

    table.index(['post_id']);
    table.index(['user_id']);
  });

  // ─────────────────────────────────────────────
  // LIKES
  // ─────────────────────────────────────────────
  await knex.schema.createTable('likes', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('post_id').notNullable().references('id').inTable('posts').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['user_id', 'post_id']);
    table.index(['post_id']);
  });

  // ─────────────────────────────────────────────
  // SHARES
  // ─────────────────────────────────────────────
  await knex.schema.createTable('shares', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('post_id').notNullable().references('id').inTable('posts').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['user_id']);
    table.index(['post_id']);
  });

  // ─────────────────────────────────────────────
  // SAVED POSTS
  // ─────────────────────────────────────────────
  await knex.schema.createTable('saved_posts', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('post_id').notNullable().references('id').inTable('posts').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['user_id', 'post_id']);
  });

  // ─────────────────────────────────────────────
  // HASHTAGS
  // ─────────────────────────────────────────────
  await knex.schema.createTable('hashtags', (table) => {
    table.increments('id').primary();
    table.string('tag', 100).notNullable();
    table.integer('post_id').notNullable().references('id').inTable('posts').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['tag', 'post_id']);
    table.index(['tag']);
  });

  // ─────────────────────────────────────────────
  // STORIES
  // ─────────────────────────────────────────────
  await knex.schema.createTable('stories', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('media_url', 500).notNullable();
    table.enum('media_type', ['image', 'video']).defaultTo('image');
    table.text('caption');
    table.jsonb('stickers').defaultTo('[]');
    table.timestamp('expires_at').notNullable();
    table.integer('views_count').defaultTo(0);
    table.timestamps(true, true);

    table.index(['user_id']);
    table.index(['expires_at']);
  });

  // ─────────────────────────────────────────────
  // MESSAGES
  // ─────────────────────────────────────────────
  await knex.schema.createTable('messages', (table) => {
    table.increments('id').primary();
    table.integer('sender_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('receiver_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('content').notNullable();
    table.enum('content_type', ['text', 'image', 'video', 'file']).defaultTo('text');
    table.string('media_url', 500);
    table.timestamp('read_at');
    table.boolean('is_deleted').defaultTo(false);
    table.timestamps(true, true);

    table.index(['sender_id']);
    table.index(['receiver_id']);
    table.index(['created_at']);
  });

  // ─────────────────────────────────────────────
  // GROUP CHATS
  // ─────────────────────────────────────────────
  await knex.schema.createTable('group_chats', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.integer('created_by').notNullable().references('id').inTable('users');
    table.string('avatar_url', 500);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('group_chat_members', (table) => {
    table.increments('id').primary();
    table.integer('group_id').notNullable().references('id').inTable('group_chats').onDelete('CASCADE');
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enum('role', ['member', 'admin']).defaultTo('member');
    table.timestamp('joined_at').defaultTo(knex.fn.now());

    table.unique(['group_id', 'user_id']);
  });

  await knex.schema.createTable('group_messages', (table) => {
    table.increments('id').primary();
    table.integer('group_id').notNullable().references('id').inTable('group_chats').onDelete('CASCADE');
    table.integer('sender_id').notNullable().references('id').inTable('users');
    table.text('content').notNullable();
    table.enum('content_type', ['text', 'image', 'file']).defaultTo('text');
    table.timestamps(true, true);

    table.index(['group_id']);
  });

  // ─────────────────────────────────────────────
  // COMMUNITIES
  // ─────────────────────────────────────────────
  await knex.schema.createTable('communities', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.string('slug', 100).notNullable().unique();
    table.text('description');
    table.string('avatar_url', 500);
    table.string('cover_url', 500);
    table.integer('admin_id').notNullable().references('id').inTable('users');
    table.enum('privacy', ['public', 'private', 'restricted']).defaultTo('public');
    table.integer('members_count').defaultTo(0);
    table.string('rules', 2000);
    table.timestamps(true, true);

    table.index(['slug']);
    table.index(['admin_id']);
  });

  await knex.schema.createTable('community_members', (table) => {
    table.increments('id').primary();
    table.integer('community_id').notNullable().references('id').inTable('communities').onDelete('CASCADE');
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enum('role', ['member', 'moderator', 'admin']).defaultTo('member');
    table.timestamp('joined_at').defaultTo(knex.fn.now());

    table.unique(['community_id', 'user_id']);
  });

  // ─────────────────────────────────────────────
  // NOTIFICATIONS
  // ─────────────────────────────────────────────
  await knex.schema.createTable('notifications', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('actor_id').references('id').inTable('users').onDelete('SET NULL');
    table.enum('type', [
      'like', 'comment', 'follow', 'mention', 'share',
      'message', 'system', 'marketplace', 'community',
    ]).notNullable();
    table.integer('resource_id');
    table.string('resource_type', 50);
    table.text('message');
    table.jsonb('data').defaultTo('{}');
    table.timestamp('read_at');
    table.timestamps(true, true);

    table.index(['user_id']);
    table.index(['created_at']);
    table.index(['read_at']);
  });

  // ─────────────────────────────────────────────
  // MARKETPLACE
  // ─────────────────────────────────────────────
  await knex.schema.createTable('marketplace_listings', (table) => {
    table.increments('id').primary();
    table.integer('seller_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('title', 200).notNullable();
    table.text('description');
    table.decimal('price', 20, 2).notNullable();
    table.string('category', 100);
    table.enum('condition', ['new', 'like_new', 'good', 'fair', 'poor']).defaultTo('good');
    table.jsonb('images').defaultTo('[]');
    table.enum('status', ['active', 'sold', 'inactive']).defaultTo('active');
    table.boolean('is_featured').defaultTo(false);
    table.integer('views_count').defaultTo(0);
    table.timestamps(true, true);

    table.index(['seller_id']);
    table.index(['status']);
    table.index(['category']);
    table.index(['price']);
  });

  await knex.schema.createTable('marketplace_orders', (table) => {
    table.increments('id').primary();
    table.integer('buyer_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('seller_id').references('id').inTable('users');
    table.integer('listing_id').references('id').inTable('marketplace_listings');
    table.decimal('amount', 20, 2).notNullable();
    table.enum('status', ['pending', 'completed', 'cancelled', 'refunded']).defaultTo('pending');
    table.timestamps(true, true);

    table.index(['buyer_id']);
    table.index(['seller_id']);
    table.index(['listing_id']);
  });

  // ─────────────────────────────────────────────
  // REFRESH TOKENS
  // ─────────────────────────────────────────────
  await knex.schema.createTable('refresh_tokens', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('token').notNullable();
    table.string('device_info', 500);
    table.string('ip_address', 45);
    table.timestamp('expires_at').notNullable();
    table.timestamps(true, true);

    table.index(['token']);
    table.index(['user_id']);
  });

  // ─────────────────────────────────────────────
  // PASSWORD RESET TOKENS
  // ─────────────────────────────────────────────
  await knex.schema.createTable('password_reset_tokens', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token', 256).notNullable();
    table.timestamp('expires_at').notNullable();
    table.boolean('is_used').defaultTo(false);
    table.timestamps(true, true);

    table.index(['token']);
    table.index(['user_id']);
  });

  // ─────────────────────────────────────────────
  // AUDIT LOGS
  // ─────────────────────────────────────────────
  await knex.schema.createTable('audit_logs', (table) => {
    table.increments('id').primary();
    table.integer('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('action', 200).notNullable();
    table.string('resource', 200);
    table.string('ip_address', 45);
    table.text('user_agent');
    table.integer('status_code');
    table.integer('duration_ms');
    table.text('request_body');
    table.timestamps(true, true);

    table.index(['user_id']);
    table.index(['action']);
    table.index(['created_at']);
    table.index(['ip_address']);
  });

  // ─────────────────────────────────────────────
  // CTF FLAGS — Vulnerability Lab
  // ─────────────────────────────────────────────
  await knex.schema.createTable('ctf_flags', (table) => {
    table.increments('id').primary();
    table.string('vulnerability_id', 10).notNullable();
    table.string('vulnerability_name', 200).notNullable();
    table.string('flag', 200).notNullable().unique();
    table.enum('difficulty', ['easy', 'medium', 'hard', 'expert']).notNullable();
    table.integer('points').notNullable();
    table.text('hint');
    table.text('description');
    table.timestamps(true, true);

    table.index(['vulnerability_id']);
    table.index(['difficulty']);
  });

  await knex.schema.createTable('ctf_submissions', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('flag_id').notNullable().references('id').inTable('ctf_flags').onDelete('CASCADE');
    table.boolean('is_correct').defaultTo(false);
    table.string('submitted_flag', 200);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['user_id']);
    table.index(['flag_id']);
  });

  // ─────────────────────────────────────────────
  // SECURITY EVENTS (for SIEM integration)
  // ─────────────────────────────────────────────
  await knex.schema.createTable('security_events', (table) => {
    table.increments('id').primary();
    table.string('type', 100).notNullable();
    table.integer('user_id').references('id').inTable('users');
    table.string('ip_address', 45);
    table.text('user_agent');
    table.enum('severity', ['low', 'medium', 'high', 'critical']).notNullable();
    table.jsonb('details').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['type']);
    table.index(['severity']);
    table.index(['created_at']);
    table.index(['ip_address']);
  });

  // ─────────────────────────────────────────────
  // COUPONS (for Business Logic lab)
  // ─────────────────────────────────────────────
  await knex.schema.createTable('coupons', (table) => {
    table.increments('id').primary();
    table.string('code', 50).notNullable().unique();
    table.decimal('discount_amount', 10, 2).notNullable();
    table.enum('type', ['percentage', 'fixed']).defaultTo('fixed');
    table.integer('max_uses').defaultTo(1);
    table.integer('used_count').defaultTo(0);
    table.timestamp('expires_at');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);

    table.index(['code']);
  });
}

export async function down(knex: Knex): Promise<void> {
  const tables = [
    'security_events', 'ctf_submissions', 'ctf_flags',
    'audit_logs', 'password_reset_tokens', 'refresh_tokens',
    'marketplace_orders', 'marketplace_listings',
    'notifications', 'community_members', 'communities',
    'group_messages', 'group_chat_members', 'group_chats',
    'messages', 'stories', 'hashtags',
    'saved_posts', 'shares', 'likes',
    'comments', 'posts', 'follows',
    'user_coins', 'users', 'coupons',
  ];

  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }
}
