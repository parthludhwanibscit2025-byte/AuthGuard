function calculateRisk({ failedAttempts = 0, deviceTrust = "known", location = "usual", sensitiveAction = false }) {
  let score = 0;
  if (failedAttempts >= 5) score += 40; else if (failedAttempts >= 3) score += 25; else if (failedAttempts >= 1) score += 10;
  if (deviceTrust === "unknown") score += 30; else if (deviceTrust === "new") score += 15;
  if (location === "unusual" || location === "foreign") score += 20; else if (location === "new") score += 10;
  if (sensitiveAction === true || sensitiveAction === "true") score += 25;
  score = Math.min(100, score);
  let level = "low";
  if (score >= 60) level = "high"; else if (score >= 30) level = "medium";
  let recommendation = "allow";
  if (level === "medium") recommendation = "step-up MFA recommended";
  if (level === "high") recommendation = "deny or require step-up MFA";
  return { score, level, recommendation, factors: { failedAttempts, deviceTrust, location, sensitiveAction: Boolean(sensitiveAction === true || sensitiveAction === "true") } };
}
module.exports = { calculateRisk };
