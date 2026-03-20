import express from 'express';
import cors from 'cors';

// Import handlers from api_logic
import adminMinistersId from '../api_logic/admin/ministers/[id].js';
import adminMinistersIndex from '../api_logic/admin/ministers/index.js';
import alertsIndex from '../api_logic/alerts/index.js';
import authLogin from '../api_logic/auth/login.js';
import authSignup from '../api_logic/auth/signup.js';
import casesResolve from '../api_logic/cases/resolve.js';
import hospitalsId from '../api_logic/hospitals/[id].js';
import hospitalsIndex from '../api_logic/hospitals/index.js';
import apiIndex from '../api_logic/index.js';
import portalsIndex from '../api_logic/portals/index.js';
import symptomsIndex from '../api_logic/symptoms/index.js';
import usersIndex from '../api_logic/users/index.js';
import usersProfile from '../api_logic/users/profile.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/', (req, res) => res.json({ 
  status: 'Backend is Live', 
  message: 'HealthWatch API is running.',
  version: 'direct_sql_v1'
}));

// Routes mapping
const routes = [
  { path: '/api/admin/ministers/:id', handler: adminMinistersId },
  { path: '/api/admin/ministers',     handler: adminMinistersIndex },
  { path: '/api/alerts',              handler: alertsIndex },
  { path: '/api/auth/login',           handler: authLogin },
  { path: '/api/auth/signup',          handler: authSignup },
  { path: '/api/cases/resolve',        handler: casesResolve },
  { path: '/api/hospitals/:id',        handler: hospitalsId },
  { path: '/api/hospitals',            handler: hospitalsIndex },
  { path: '/api/portals',              handler: portalsIndex },
  { path: '/api/symptoms',             handler: symptomsIndex },
  { path: '/api/users/profile',        handler: usersProfile },
  { path: '/api/users',                handler: usersIndex },
  { path: '/api',                      handler: apiIndex }
];

// Register routes
routes.forEach(({ path, handler }) => {
  app.all(path, async (req, res) => {
    try {
      // Emulate Vercel's merging of query and params for consistency
      const mergedQuery = { ...req.query, ...req.params };
      Object.defineProperty(req, 'query', {
        value: mergedQuery,
        enumerable: true,
        configurable: true,
        writable: true
      });
      await handler(req, res);
    } catch (error) {
      console.error(`Error in route ${path}:`, error);
      if (!res.headersSent) res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  });
});

export default app;
