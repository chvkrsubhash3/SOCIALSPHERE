import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import multer from 'multer';
import sanitizeHtml from 'sanitize-html';
import { db, rawQuery } from '../config/database';
import { config } from '../config/env';
import { minioClient } from '../config/minio';
import { logSecurityEvent } from '../utils/logger';

const execAsync = promisify(exec);

// ═══════════════════════════════════════════════════════════════
//                    UPLOAD CONTROLLER
//
// Vulnerabilities: File Upload, SSRF, Command Injection,
//                  Directory Traversal, SSTI
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// UPLOAD AVATAR
//
// ⚠️ VULN #11: Unrestricted File Upload
// ⚠️ VULN #28: Command Injection (via filename)
// ─────────────────────────────────────────────
export async function uploadAvatar(req: Request, res: Response): Promise<void> {
  const file = req.file;
  const userId = req.user!.userId;

  if (!file) {
    res.status(400).json({ error: 'No file provided' });
    return;
  }

  if (config.trainingMode) {
    // ⚠️ VULN #11: No file type validation
    // Accepts any file extension including .php, .jsp, .sh
    // CWE-434: Unrestricted Upload of File with Dangerous Type
    // CVSS: 9.8 Critical

    // ⚠️ VULN #28: Command Injection in image processing
    // Filename passed directly to shell command
    // CWE-78: OS Command Injection
    // Try: filename = "'; cat /etc/passwd; echo '"
    const filename = file.originalname;
    try {
      // ⚠️ Inject via filename: avatar; cat /etc/passwd
      await execAsync(`convert uploads/${filename} -resize 200x200 thumbnails/${filename}`);
    } catch {
      // Continue even if command fails
    }

    const fileUrl = `/uploads/${filename}`;
    await db('users').where({ id: userId }).update({ avatar_url: fileUrl });

    res.json({
      message: 'Avatar uploaded',
      url: fileUrl,
      originalName: filename,
      // ⚠️ VULN: Discloses server file path
      serverPath: path.join(process.cwd(), 'uploads', filename),
    });
  } else {
    // 🔒 SECURE: Strict file validation
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const MAX_SIZE = 5 * 1024 * 1024;  // 5MB

    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      fs.unlinkSync(file.path);
      res.status(400).json({ error: 'Only JPEG, PNG, WebP, and GIF images are allowed' });
      return;
    }

    if (file.size > MAX_SIZE) {
      fs.unlinkSync(file.path);
      res.status(400).json({ error: 'File size must be under 5MB' });
      return;
    }

    // 🔒 Generate safe filename (no user input in filename)
    const ext = path.extname(file.originalname).toLowerCase();
    const safeFilename = `avatar_${userId}_${Date.now()}${ext}`;

    // 🔒 Use sharp for image processing (no shell execution)
    const sharp = require('sharp');
    const processedBuffer = await sharp(file.path)
      .resize(200, 200, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Upload to MinIO
    await minioClient.putObject(
      config.minio.bucket,
      `avatars/${safeFilename}`,
      processedBuffer,
      { 'Content-Type': 'image/jpeg' }
    );

    fs.unlinkSync(file.path);

    const fileUrl = `/uploads/avatars/${safeFilename}`;
    await db('users').where({ id: userId }).update({ avatar_url: fileUrl });

    res.json({ message: 'Avatar uploaded', url: fileUrl });
  }
}

// ─────────────────────────────────────────────
// PROFILE IMAGE FROM URL (SSRF)
//
// ⚠️ VULN #12: Server-Side Request Forgery
// ─────────────────────────────────────────────
export async function setAvatarFromUrl(req: Request, res: Response): Promise<void> {
  const { imageUrl } = req.body;
  const userId = req.user!.userId;

  if (!imageUrl) {
    res.status(400).json({ error: 'Image URL is required' });
    return;
  }

  if (config.trainingMode) {
    // ⚠️ VULN #12: SSRF
    // Fetches arbitrary URLs from the server's perspective
    // Attack vectors:
    //   - http://169.254.169.254/latest/meta-data/ (AWS metadata)
    //   - http://localhost:5432/ (internal PostgreSQL)
    //   - http://redis:6379/ (internal Redis)
    //   - file:///etc/passwd
    // CWE-918: Server-Side Request Forgery
    // CVSS: 9.8 Critical

    const fetch = require('node-fetch');
    try {
      const response = await fetch(imageUrl);  // ⚠️ No URL validation
      const buffer = await response.buffer();

      await db('users').where({ id: userId }).update({ avatar_url: imageUrl });

      res.json({
        message: 'Avatar set from URL',
        url: imageUrl,
        // ⚠️ Returns response headers (internal info leakage)
        responseHeaders: Object.fromEntries(response.headers),
        responseSize: buffer.length,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  } else {
    // 🔒 SECURE: Validate URL against allowlist
    const ALLOWED_DOMAINS = ['cdn.socialsphere.local', 'images.unsplash.com', 'pbs.twimg.com'];

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      res.status(400).json({ error: 'Invalid URL' });
      return;
    }

    // 🔒 Block private IP ranges and internal services
    const hostname = parsedUrl.hostname;
    const BLOCKED_PATTERNS = [
      /^localhost$/i, /^127\./,  /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^::1$/,
      /\.local$/,
    ];

    if (BLOCKED_PATTERNS.some((p) => p.test(hostname))) {
      logSecurityEvent({
        type: 'SSRF_ATTEMPT',
        userId: userId.toString(),
        ip: req.ip,
        severity: 'critical',
        details: { url: imageUrl },
      });
      res.status(400).json({ error: 'URL not allowed' });
      return;
    }

    if (!ALLOWED_DOMAINS.includes(hostname)) {
      res.status(400).json({ error: 'Image must be from an approved domain' });
      return;
    }

    await db('users').where({ id: userId }).update({ avatar_url: imageUrl });
    res.json({ message: 'Avatar set from URL', url: imageUrl });
  }
}

// ─────────────────────────────────────────────
// FILE DOWNLOAD (Directory Traversal)
//
// ⚠️ VULN #27: Directory Traversal
// ─────────────────────────────────────────────
export async function downloadFile(req: Request, res: Response): Promise<void> {
  const { filename } = req.params;

  if (config.trainingMode) {
    // ⚠️ VULN #27: Path Traversal
    // Try: /api/upload/download/../../etc/passwd
    // Try: /api/upload/download/..%2F..%2Fetc%2Fpasswd
    // CWE-22: Improper Limitation of a Pathname to a Restricted Directory
    // CVSS: 7.5 High

    const filePath = path.join(process.cwd(), 'uploads', filename);  // ⚠️ No path validation

    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        error: 'File not found',
        path: filePath,  // ⚠️ Leaks server path
      });
      return;
    }

    res.download(filePath);
  } else {
    // 🔒 SECURE: Resolve and validate path is within uploads dir
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    const requestedPath = path.resolve(uploadsDir, filename);

    if (!requestedPath.startsWith(uploadsDir)) {
      logSecurityEvent({
        type: 'PATH_TRAVERSAL_ATTEMPT',
        ip: req.ip,
        userId: req.user?.userId?.toString(),
        severity: 'high',
        details: { filename, resolvedPath: requestedPath },
      });
      res.status(400).json({ error: 'Invalid file path' });
      return;
    }

    if (!fs.existsSync(requestedPath)) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    res.download(requestedPath);
  }
}

// ─────────────────────────────────────────────
// XML IMPORT (XXE)
//
// ⚠️ VULN #13: XML External Entity Injection
// ─────────────────────────────────────────────
export async function importXml(req: Request, res: Response): Promise<void> {
  const { xmlData } = req.body;

  if (!xmlData) {
    res.status(400).json({ error: 'XML data is required' });
    return;
  }

  const xml2js = require('xml2js');

  if (config.trainingMode) {
    // ⚠️ VULN #13: XXE Injection
    // Payload: <?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><root><data>&xxe;</data></root>
    // CWE-611: Improper Restriction of XML External Entity Reference
    // CVSS: 9.1 Critical

    xml2js.parseString(
      xmlData,
      {
        // ⚠️ External entity processing enabled
        strict: false,
      },
      (err: any, result: any) => {
        if (err) {
          res.status(400).json({ error: err.message });
          return;
        }
        res.json({ parsed: result, message: 'XML imported successfully' });
      }
    );
  } else {
    // 🔒 SECURE: Disable external entity processing
    // Use a safe XML parser configuration
    const DOMParser = require('@xmldom/xmldom').DOMParser;
    const parser = new DOMParser({
      // 🔒 Disable external entities
      locator: {},
      errorHandler: {
        warning: () => {},
        error: (msg: string) => { throw new Error(msg); },
        fatalError: (msg: string) => { throw new Error(msg); },
      },
    });

    try {
      const doc = parser.parseFromString(xmlData, 'text/xml');
      // Process safe XML
      res.json({ message: 'XML imported successfully' });
    } catch (err: any) {
      res.status(400).json({ error: 'Invalid XML' });
    }
  }
}
