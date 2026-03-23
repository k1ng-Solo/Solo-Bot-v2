const logger = {
    info: (...args) => console.log('[INFO]:', ...args),
    error: (...args) => console.error('[ERROR]:', ...args),
    warn: (...args) => console.warn('[WARN]:', ...args),
    debug: (...args) => console.log('[DEBUG]:', ...args),
    trace: (...args) => console.log('[TRACE]:', ...args),
    child: () => logger // This added line fixes the new crash!
};

module.exports = logger;