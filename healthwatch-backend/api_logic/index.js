export default function handler(req, res) {
  res.json({
    status: "✅ HealthWatch API is running",
    version: "1.0.0",
    endpoints: [
      "/api/auth/login",
      "/api/auth/signup",
      "/api/hospitals",
      "/api/symptoms",
      "/api/alerts",
      "/api/portals",
      "/api/users/profile",
      "/api/cases/resolve",
      "/api/admin/ministers",
    ],
  });
}
