import { Server } from 'http';
import { createApp } from './app';
import { env } from './config/env';

/**
 * Start the Express server
 */
function startServer(): Server {
  const app = createApp();
  const port = parseInt(env.PORT, 10);

  const server = app.listen(port, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   ☕ Coffee Shop Backend API                               ║
║                                                            ║
║   Environment: ${env.NODE_ENV.padEnd(43)}║
║   Port: ${port.toString().padEnd(50)}║
║   URL: http://localhost:${port.toString().padEnd(40)}║
║                                                            ║
║   Health Check: http://localhost:${port}/health${' '.padEnd(21)}║
║   API Info: http://localhost:${port}/api${' '.padEnd(24)}║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
  });

  // Handle server errors
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`
❌ Error: Port ${port} is already in use.
   Please try one of the following:
   1. Stop the process using port ${port}
   2. Change the PORT in your .env file
   3. Kill the process: lsof -ti:${port} | xargs kill
      `);
      process.exit(1);
    } else if (error.code === 'EACCES') {
      console.error(`
❌ Error: Permission denied to use port ${port}.
   Try using a port number greater than 1024.
      `);
      process.exit(1);
    } else {
      console.error('❌ Server error:', error);
      process.exit(1);
    }
  });

  return server;
}

/**
 * Graceful shutdown handler
 */
function setupGracefulShutdown(server: Server): void {
  const shutdown = (signal: string) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    server.close(() => {
      console.log('✅ Server closed. All connections terminated.');
      process.exit(0);
    });

    // Force shutdown after 10 seconds if graceful shutdown fails
    setTimeout(() => {
      console.error('❌ Graceful shutdown timeout. Forcing exit...');
      process.exit(1);
    }, 10000);
  };

  // Listen for termination signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    console.error('❌ Uncaught Exception:', error);
    shutdown('UNCAUGHT_EXCEPTION');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any) => {
    console.error('❌ Unhandled Rejection:', reason);
    shutdown('UNHANDLED_REJECTION');
  });
}

// Start the server
const server = startServer();

// Setup graceful shutdown
setupGracefulShutdown(server);
