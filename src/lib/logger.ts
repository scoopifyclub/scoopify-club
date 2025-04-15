import { NextRequest } from 'next/server';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  path?: string;
  method?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

class Logger {
  private static instance: Logger;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatLog(entry: LogEntry): string {
    const base = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;
    const metadata = entry.metadata ? `\nMetadata: ${JSON.stringify(entry.metadata, null, 2)}` : '';
    const context = entry.requestId ? `\nRequest ID: ${entry.requestId}` : '';
    return `${base}${context}${metadata}`;
  }

  private log(level: LogLevel, message: string, request?: NextRequest, metadata?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      requestId: request?.headers.get('x-request-id') || undefined,
      path: request?.nextUrl.pathname,
      method: request?.method,
      metadata,
    };

    const formattedLog = this.formatLog(entry);

    switch (level) {
      case 'error':
        console.error(formattedLog);
        break;
      case 'warn':
        console.warn(formattedLog);
        break;
      case 'info':
        console.info(formattedLog);
        break;
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formattedLog);
        }
        break;
    }
  }

  public info(message: string, request?: NextRequest, metadata?: Record<string, any>) {
    this.log('info', message, request, metadata);
  }

  public warn(message: string, request?: NextRequest, metadata?: Record<string, any>) {
    this.log('warn', message, request, metadata);
  }

  public error(message: string, request?: NextRequest, metadata?: Record<string, any>) {
    this.log('error', message, request, metadata);
  }

  public debug(message: string, request?: NextRequest, metadata?: Record<string, any>) {
    this.log('debug', message, request, metadata);
  }
}

export const logger = Logger.getInstance(); 