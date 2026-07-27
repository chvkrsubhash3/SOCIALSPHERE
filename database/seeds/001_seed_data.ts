import { Knex } from 'knex';
import crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════
//                  DATABASE SEED DATA
//    Realistic fictional users, posts, and CTF flags
// ═══════════════════════════════════════════════════════════════

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data
  await knex('ctf_submissions').del();
  await knex('ctf_flags').del();
  await knex('security_events').del();
  await knex('audit_logs').del();
  await knex('notifications').del();
  await knex('marketplace_orders').del();
  await knex('marketplace_listings').del();
  await knex('messages').del();
  await knex('saved_posts').del();
  await knex('shares').del();
  await knex('likes').del();
  await knex('comments').del();
  await knex('posts').del();
  await knex('follows').del();
  await knex('user_coins').del();
  await knex('users').del();
  await knex('coupons').del();

  // ─────────────────────────────────────────────
  // SEED USERS
  // ─────────────────────────────────────────────
  // ⚠️ Note: In training mode, passwords are MD5 hashed (insecure by design)
  // Training mode uses MD5('password') for all test accounts

  const md5 = (str: string) => crypto.createHash('md5').update(str).digest('hex');

  const users = [
    {
      id: 1,
      username: 'admin',
      email: 'admin@socialsphere.local',
      password_hash: md5('Admin@123!'),  // ⚠️ MD5 (training mode)
      display_name: 'SocialSphere Admin',
      bio: 'Platform administrator. Building the future of social.',
      role: 'admin',
      is_active: true,
      is_verified: true,
      avatar_url: '/api/placeholder/avatar/1',
    },
    {
      id: 2,
      username: 'moderator',
      email: 'mod@socialsphere.local',
      password_hash: md5('Mod@123!'),
      display_name: 'Content Moderator',
      bio: 'Keeping the platform safe and friendly.',
      role: 'moderator',
      is_active: true,
      is_verified: true,
      avatar_url: '/api/placeholder/avatar/2',
    },
    {
      id: 3,
      username: 'alice',
      email: 'alice@example.com',
      password_hash: md5('password123'),
      display_name: 'Alice Johnson',
      bio: 'Travel enthusiast 🌍 | Coffee addict ☕ | Software Engineer',
      role: 'user',
      is_active: true,
      is_verified: true,
      avatar_url: '/api/placeholder/avatar/3',
    },
    {
      id: 4,
      username: 'bob',
      email: 'bob@example.com',
      password_hash: md5('password123'),
      display_name: 'Bob Martinez',
      bio: 'Photographer 📸 | Nature lover 🌿 | Based in San Francisco',
      role: 'user',
      is_active: true,
      is_verified: true,
      avatar_url: '/api/placeholder/avatar/4',
    },
    {
      id: 5,
      username: 'charlie',
      email: 'charlie@example.com',
      password_hash: md5('password123'),
      display_name: 'Charlie Chen',
      bio: 'Full stack developer | Building things that matter',
      role: 'user',
      is_active: true,
      is_verified: false,
      avatar_url: '/api/placeholder/avatar/5',
    },
    {
      id: 6,
      username: 'diana',
      email: 'diana@example.com',
      password_hash: md5('password123'),
      display_name: 'Diana Patel',
      bio: 'UX Designer | Making the web beautiful | 🎨',
      role: 'user',
      is_active: true,
      is_verified: true,
      avatar_url: '/api/placeholder/avatar/6',
    },
    {
      id: 7,
      username: 'eve',
      email: 'eve@example.com',
      password_hash: md5('password123'),
      display_name: 'Eve Wilson',
      bio: 'Cybersecurity researcher | Bug bounty hunter 🐛',
      role: 'user',
      is_active: true,
      is_verified: true,
      avatar_url: '/api/placeholder/avatar/7',
    },
    {
      id: 8,
      username: 'frank',
      email: 'frank@example.com',
      password_hash: md5('password123'),
      display_name: 'Frank Nguyen',
      bio: 'Startup founder | Investor | Entrepreneur',
      role: 'user',
      is_active: true,
      is_verified: true,
      avatar_url: '/api/placeholder/avatar/8',
    },
    // Hidden admin account for privilege escalation lab
    {
      id: 9,
      username: 'superadmin',
      email: 'superadmin@socialsphere.internal',
      password_hash: md5('SuperAdmin@2024!'),
      display_name: 'Super Administrator',
      bio: '',
      role: 'superadmin',
      is_active: true,
      is_verified: true,
      avatar_url: null,
    },
    // Vulnerable user for IDOR demos
    {
      id: 10,
      username: 'victim',
      email: 'victim@example.com',
      password_hash: md5('victim123'),
      display_name: 'Victim User',
      bio: 'This account contains sensitive private information.',
      role: 'user',
      is_active: true,
      is_verified: true,
      avatar_url: '/api/placeholder/avatar/10',
    },
  ];

  await knex('users').insert(users.map((u) => ({
    ...u,
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    updated_at: new Date(),
  })));

  // ─── User Coins ───
  const coinData = users.map((u) => ({
    user_id: u.id,
    balance: u.role === 'admin' ? 99999 : Math.floor(Math.random() * 5000) + 100,
  }));
  await knex('user_coins').insert(coinData);

  // ─── Follows ───
  const follows = [
    { follower_id: 3, following_id: 4 }, { follower_id: 3, following_id: 5 },
    { follower_id: 3, following_id: 6 }, { follower_id: 4, following_id: 3 },
    { follower_id: 4, following_id: 7 }, { follower_id: 5, following_id: 3 },
    { follower_id: 5, following_id: 8 }, { follower_id: 6, following_id: 3 },
    { follower_id: 6, following_id: 4 }, { follower_id: 7, following_id: 5 },
    { follower_id: 7, following_id: 8 }, { follower_id: 8, following_id: 3 },
  ];

  await knex('follows').insert(follows.map((f) => ({
    ...f,
    created_at: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000),
  })));

  // ─────────────────────────────────────────────
  // SEED POSTS
  // ─────────────────────────────────────────────
  const posts = [
    {
      user_id: 3,
      content: 'Just landed in Tokyo! The city is absolutely incredible 🗼 #travel #tokyo #photography',
      privacy: 'public', likes_count: 145, comments_count: 23, shares_count: 8,
    },
    {
      user_id: 4,
      content: 'Golden hour at the Golden Gate Bridge. Sometimes you just need to stop and appreciate the view. #photography #sanfrancisco #sunset',
      privacy: 'public', likes_count: 287, comments_count: 41, shares_count: 15,
    },
    {
      user_id: 5,
      content: 'Just shipped a major feature that reduced our API response time by 40%! The power of Redis caching is real 🚀 #webdev #nodejs #performance',
      privacy: 'public', likes_count: 92, comments_count: 18, shares_count: 5,
    },
    {
      user_id: 6,
      content: 'New design system launch today! 3 months of work. Would love your feedback 🎨 #uxdesign #ui #design',
      privacy: 'public', likes_count: 213, comments_count: 35, shares_count: 12,
    },
    {
      user_id: 7,
      content: 'Found an interesting IDOR vulnerability in a popular platform today. Responsibly disclosed! #bugbounty #cybersecurity #websecurity',
      privacy: 'public', likes_count: 167, comments_count: 29, shares_count: 20,
    },
    {
      user_id: 3,
      content: 'Morning coffee and code. The perfect start to any day ☕💻 #developer #morning #coffee',
      privacy: 'public', likes_count: 78, comments_count: 12, shares_count: 3,
    },
    {
      user_id: 8,
      content: 'Excited to announce our Series A! $5M raised to build the future of [REDACTED]. Thanks to all our early believers. #startup #funding',
      privacy: 'public', likes_count: 512, comments_count: 87, shares_count: 45,
    },
    {
      user_id: 10,
      content: 'This is my private post. Only I should see this.',
      privacy: 'private', likes_count: 0, comments_count: 0, shares_count: 0,
    },
    {
      user_id: 10,
      content: 'My bank account number is 1234-5678-9012. Just kidding! But this IS private. #private',
      privacy: 'private', likes_count: 0, comments_count: 0, shares_count: 0,
    },
  ];

  const insertedPosts = await knex('posts').insert(posts.map((p) => ({
    ...p,
    media_urls: JSON.stringify([]),
    created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    updated_at: new Date(),
  }))).returning('id');

  // ─── Comments ───
  const comments = [
    { post_id: insertedPosts[0].id, user_id: 4, content: 'Amazing shot! What camera are you using?' },
    { post_id: insertedPosts[0].id, user_id: 5, content: 'Tokyo is on my bucket list! 🗾' },
    { post_id: insertedPosts[1].id, user_id: 3, content: 'Absolutely gorgeous! Great composition.' },
    { post_id: insertedPosts[2].id, user_id: 7, content: 'What caching strategy did you use?' },
    { post_id: insertedPosts[4].id, user_id: 5, content: 'Great work! What was the bounty amount? 🤑' },
  ];

  await knex('comments').insert(comments.map((c) => ({
    ...c,
    likes_count: Math.floor(Math.random() * 20),
    created_at: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
    updated_at: new Date(),
  })));

  // ─────────────────────────────────────────────
  // SEED MARKETPLACE
  // ─────────────────────────────────────────────
  await knex('marketplace_listings').insert([
    {
      seller_id: 3,
      title: 'Sony Alpha A7R V Camera',
      description: 'Professional mirrorless camera, barely used. All original accessories included.',
      price: 3200,
      category: 'Electronics',
      condition: 'like_new',
      images: JSON.stringify(['/api/placeholder/listing/1']),
      status: 'active',
      is_featured: true,
      created_at: new Date(),
    },
    {
      seller_id: 4,
      title: 'Photography Masterclass Bundle',
      description: 'Complete course materials for professional photography. 50+ hours of content.',
      price: 150,
      category: 'Education',
      condition: 'good',
      images: JSON.stringify(['/api/placeholder/listing/2']),
      status: 'active',
      is_featured: false,
      created_at: new Date(),
    },
    {
      seller_id: 8,
      title: 'MacBook Pro M3 14"',
      description: 'Work horse laptop. M3 Pro chip, 36GB RAM, 1TB SSD.',
      price: 2800,
      category: 'Electronics',
      condition: 'like_new',
      images: JSON.stringify(['/api/placeholder/listing/3']),
      status: 'active',
      is_featured: true,
      created_at: new Date(),
    },
  ]);

  // ─────────────────────────────────────────────
  // SEED COUPONS (Business Logic lab)
  // ─────────────────────────────────────────────
  await knex('coupons').insert([
    { code: 'WELCOME10', discount_amount: 10, type: 'percentage', max_uses: 1000, is_active: true },
    { code: 'ADMIN50', discount_amount: 50, type: 'percentage', max_uses: 1, is_active: true },
    { code: 'FREESTUFF', discount_amount: 999999, type: 'fixed', max_uses: 1, is_active: true },
  ]);

  // ─────────────────────────────────────────────
  // SEED CTF FLAGS
  // ─────────────────────────────────────────────
  const ctfFlags = [
    // SQL Injection
    { vulnerability_id: 'V01', vulnerability_name: 'SQL Injection', flag: 'SS{sql_inject10n_bypass_auth}', difficulty: 'easy', points: 100, hint: 'Try a classic OR condition in the login form email field' },
    { vulnerability_id: 'V01', vulnerability_name: 'SQL Injection - UNION', flag: 'SS{uni0n_based_d4ta_exfil}', difficulty: 'medium', points: 200, hint: 'UNION SELECT can extract data from other tables' },
    { vulnerability_id: 'V01', vulnerability_name: 'SQL Injection - Admin', flag: 'SS{sqli_admin_pwnage_2024}', difficulty: 'hard', points: 300, hint: 'The admin search endpoint in /api/search/admin is particularly vulnerable' },
    { vulnerability_id: 'V02', vulnerability_name: 'Blind SQLi', flag: 'SS{blind_sqli_t1me_based}', difficulty: 'expert', points: 500, hint: 'Time-based blind injection: SLEEP() or pg_sleep()' },
    // XSS
    { vulnerability_id: 'V03', vulnerability_name: 'Stored XSS', flag: 'SS{st0red_xss_c00kie_steal}', difficulty: 'medium', points: 200, hint: 'Post content is stored without sanitization. Try <script>...' },
    { vulnerability_id: 'V04', vulnerability_name: 'Reflected XSS', flag: 'SS{r3fl3ct3d_xss_search}', difficulty: 'easy', points: 100, hint: 'The search endpoint reflects your query in the response' },
    { vulnerability_id: 'V05', vulnerability_name: 'DOM XSS', flag: 'SS{d0m_xss_hash_injection}', difficulty: 'medium', points: 200, hint: 'Check the URL hash parameter handling in the frontend' },
    // JWT
    { vulnerability_id: 'V08', vulnerability_name: 'JWT None Algorithm', flag: 'SS{jwt_n0ne_alg_byp4ss}', difficulty: 'medium', points: 250, hint: 'What happens if you change the JWT header alg to "none"?' },
    { vulnerability_id: 'V08', vulnerability_name: 'JWT Weak Secret', flag: 'SS{jwt_w34k_s3cr3t_cr4cked}', difficulty: 'hard', points: 350, hint: 'The JWT secret might be guessable. Try common words...' },
    // IDOR
    { vulnerability_id: 'V09', vulnerability_name: 'IDOR - Private Posts', flag: 'SS{id0r_pr1vate_p0st_1337}', difficulty: 'easy', points: 100, hint: 'Can you access private posts by changing the post ID?' },
    { vulnerability_id: 'V09', vulnerability_name: 'IDOR - Messages', flag: 'SS{id0r_mess4ge_enum}', difficulty: 'medium', points: 200, hint: 'Messages endpoint at /api/messages/{id} - try other IDs' },
    { vulnerability_id: 'V09', vulnerability_name: 'IDOR - Orders', flag: 'SS{id0r_0rder_d4ta_l34k}', difficulty: 'medium', points: 200, hint: 'Marketplace orders: /api/marketplace/orders/{id}' },
    // Access Control
    { vulnerability_id: 'V10', vulnerability_name: 'Broken Access Control', flag: 'SS{r0le_t4mper_admin_4cc3ss}', difficulty: 'hard', points: 350, hint: 'Try adding role:admin to your request body on admin endpoints' },
    // File Upload
    { vulnerability_id: 'V11', vulnerability_name: 'File Upload - WebShell', flag: 'SS{w3bsh3ll_upl04d_pwn3d}', difficulty: 'hard', points: 400, hint: 'Can you upload a .php file as an avatar?' },
    // SSRF
    { vulnerability_id: 'V12', vulnerability_name: 'SSRF - Internal Services', flag: 'SS{ssrf_int3rnal_n3tw0rk}', difficulty: 'hard', points: 400, hint: 'The avatar URL import fetches from any URL. Try http://redis:6379/' },
    { vulnerability_id: 'V12', vulnerability_name: 'SSRF - Cloud Metadata', flag: 'SS{ssrf_cl0ud_m3t4d4t4}', difficulty: 'expert', points: 500, hint: 'AWS metadata endpoint: http://169.254.169.254/latest/meta-data/' },
    // CSRF
    { vulnerability_id: 'V06', vulnerability_name: 'CSRF - Follow', flag: 'SS{csrf_f0ll0w_s0ci4l_eng}', difficulty: 'easy', points: 100, hint: 'Create an HTML page that auto-submits a follow request' },
    { vulnerability_id: 'V06', vulnerability_name: 'CSRF - Password Change', flag: 'SS{csrf_pwd_ch4ng3_4cc_tak3}', difficulty: 'medium', points: 250, hint: 'Can you change a victim\'s password via CSRF?' },
    // Business Logic
    { vulnerability_id: 'V21', vulnerability_name: 'Negative Coin Transfer', flag: 'SS{n3g_4m0unt_coin_gr4b}', difficulty: 'medium', points: 200, hint: 'What happens when you transfer a negative amount of coins?' },
    { vulnerability_id: 'V21', vulnerability_name: 'Buy Own Listing', flag: 'SS{s3lf_tr4de_byp4ss}', difficulty: 'easy', points: 100, hint: 'Can you purchase your own marketplace listing?' },
    // Privilege Escalation
    { vulnerability_id: 'V49', vulnerability_name: 'Privilege Escalation to Admin', flag: 'SS{pr1v_3sc_t0_4dm1n}', difficulty: 'hard', points: 400, hint: 'The role update endpoint. Can a moderator make themselves admin?' },
    { vulnerability_id: 'V49', vulnerability_name: 'Privilege Escalation to SuperAdmin', flag: 'SS{pr1v_3sc_sup3r4dm1n}', difficulty: 'expert', points: 500, hint: 'Find a way to reach the superadmin role' },
    // Path Traversal
    { vulnerability_id: 'V27', vulnerability_name: 'Directory Traversal', flag: 'SS{p4th_tr4v3rs4l_3tc_p4sswd}', difficulty: 'medium', points: 250, hint: 'File download endpoint: /api/upload/download/../../etc/passwd' },
    // Command Injection
    { vulnerability_id: 'V28', vulnerability_name: 'Command Injection', flag: 'SS{cmd_inj3ct_rce_0wn3d}', difficulty: 'expert', points: 500, hint: 'The avatar upload processes images with a shell command using the filename' },
    // Account Takeover
    { vulnerability_id: 'V50', vulnerability_name: 'Account Takeover via Reset Token', flag: 'SS{acc_t4k30v3r_reset_t0k3n}', difficulty: 'hard', points: 400, hint: 'Password reset tokens are predictable. Can you guess one?' },
  ];

  await knex('ctf_flags').insert(ctfFlags.map((f) => ({
    ...f,
    created_at: new Date(),
    updated_at: new Date(),
  })));
}
