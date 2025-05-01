class Logger {
    constructor() {
        this.isDevelopment = process.env.NODE_ENV === 'development';
    }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    formatLog(entry) {
        const base = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;
        const metadata = entry.metadata ? `\nMetadata: ${JSON.stringify(entry.metadata, null, 2)}` : '';
        const context = entry.requestId ? `\nRequest ID: ${entry.requestId}` : '';
        return `${base}${context}${metadata}`;
    }
    log(level, message, request, metadata) {
        const entry = {
            level,
            message,
            timestamp: new Date().toISOString(),
            requestId: request?.headers?.get('x-request-id') || undefined,
            path: request?.nextUrl?.pathname || undefined,
            method: request?.method || undefined,
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
    info(message, request, metadata) {
        this.log('info', message, request, metadata);
    }
    warn(message, request, metadata) {
        this.log('warn', message, request, metadata);
    }
    error(message, request, metadata) {
        this.log('error', message, request, metadata);
    }
    debug(message, request, metadata) {
        this.log('debug', message, request, metadata);
    }
}
export const logger = Logger.getInstance();
