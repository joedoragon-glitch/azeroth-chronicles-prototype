'use strict';
const http = require('node:http'),
  fs = require('node:fs'),
  path = require('node:path');
const root = path.resolve(__dirname, '..'),
  port = Number(process.env.PORT || 8080),
  types = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.webmanifest': 'application/manifest+json',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };
http
  .createServer((req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost'),
        relative = decodeURIComponent(url.pathname).replace(/^\/+/, ''),
        file = path.resolve(root, relative || 'index.html');
      if (
        !file.startsWith(root + path.sep) ||
        relative.startsWith('.') ||
        relative.split('/').includes('..')
      ) {
        res.writeHead(403);
        return res.end('Forbidden');
      }
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
        res.writeHead(404);
        return res.end('Not found');
      }
      res.writeHead(200, {
        'Content-Type': types[path.extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      fs.createReadStream(file).pipe(res);
    } catch (_) {
      res.writeHead(400);
      res.end('Invalid request');
    }
  })
  .listen(port, '127.0.0.1', () =>
    console.log('Azeroth Chronicles: http://127.0.0.1:' + port + ' · phone: /phone.html'),
  );
