import app from '@/server/app';
import { NextRequest } from 'next/server';

async function handle(req: NextRequest) {
  return new Promise<Response>((resolve) => {
    const url = new URL(req.url);
    const mockReq: any = {
      method: req.method,
      url: url.pathname + url.search,
      headers: Object.fromEntries(req.headers.entries()),
      ip: req.headers.get('x-forwarded-for') || '127.0.0.1',
    };

    req.text().then((bodyText) => {
      let body = {};
      try {
        if (bodyText) body = JSON.parse(bodyText);
      } catch {
        body = bodyText;
      }
      mockReq.body = body;

      const resHeaders = new Headers();
      let statusCode = 200;

      const mockRes: any = {
        status(code: number) {
          statusCode = code;
          return this;
        },
        setHeader(name: string, value: string) {
          resHeaders.set(name, value);
          return this;
        },
        header(name: string, value: string) {
          resHeaders.set(name, value);
          return this;
        },
        json(data: any) {
          resHeaders.set('Content-Type', 'application/json');
          resolve(new Response(JSON.stringify(data), { status: statusCode, headers: resHeaders }));
          return this;
        },
        send(data: any) {
          const bodyStr = typeof data === 'object' ? JSON.stringify(data) : data;
          resolve(new Response(bodyStr, { status: statusCode, headers: resHeaders }));
          return this;
        },
        end(data: any) {
          resolve(new Response(data || '', { status: statusCode, headers: resHeaders }));
          return this;
        },
      };

      app(mockReq, mockRes);
    });
  });
}

export async function GET(req: NextRequest) { return handle(req); }
export async function POST(req: NextRequest) { return handle(req); }
export async function PUT(req: NextRequest) { return handle(req); }
export async function DELETE(req: NextRequest) { return handle(req); }
export async function PATCH(req: NextRequest) { return handle(req); }
