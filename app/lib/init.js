import { initializeDatabase } from './schema.js';

// Call this during app initialization
initializeDatabase().catch(console.error);