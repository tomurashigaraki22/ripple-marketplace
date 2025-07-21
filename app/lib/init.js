import { initializeDatabase } from './schema';

// Call this during app initialization
initializeDatabase().catch(console.error);