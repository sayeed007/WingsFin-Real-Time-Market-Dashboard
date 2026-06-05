/* eslint-disable no-process-env -- this setup file intentionally pins env for hermetic tests */
import { config as loadDotenv } from 'dotenv';

// Load local .env for harmless values (e.g. DATABASE_URL) so the env module
// validates successfully.
loadDotenv();

// Pin the market session window for unit tests so they stay hermetic and do not
// depend on a developer's local .env overrides (e.g. a widened window used for
// manual demoing). The market.service tests assert against this 10:00–14:30
// Asia/Dhaka window.
process.env.NODE_ENV = 'test';
process.env.MARKET_TIMEZONE = 'Asia/Dhaka';
process.env.MARKET_OPEN_TIME = '10:00';
process.env.MARKET_CLOSE_TIME = '14:30';
