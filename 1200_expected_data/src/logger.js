import winston from 'winston';
import winstonDaily from 'winston-daily-rotate-file';

const logDir = '../logs';  // Setting Directory
const { combine, timestamp, printf } = winston.format;

// Define Log Format
const logFormat = printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`);

// Log Level
// error : 0 , warn : 1 , info : 2 , http : 3 , verbose : 4 , debug : 5 , silly : 6

const logger = winston.createLogger({
    format: combine(
        timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        logFormat,
    ),
    transports: [
        // error log setting
        new winstonDaily({
            level: 'error',
            datePattern: 'YYYY-MM-DD',
            dirname: logDir,
            filename: '%DATE%_error.log',
            maxFiles: 30,
            json: false,
            zippedArchive: true,
        }),
        // info log setting
        new winstonDaily({
            level: 'info',
            datePattern: 'YYYY-MM-DD',
            dirname: logDir,
            filename: '%DATE%_error.log',
            maxFiles: 30,
            json: false,
            zippedArchive: true,
        }),
    ],
});

export { logger };