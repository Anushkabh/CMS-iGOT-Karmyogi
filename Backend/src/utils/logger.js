const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = levels[process.env.LOG_LEVEL || "info"];

const log = (level, message, meta) => {
  if (levels[level] <= currentLevel) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(meta && { meta }),
    };
    const output =
      level === "error" || level === "warn" ? process.stderr : process.stdout;
    output.write(JSON.stringify(entry) + "\n");
  }
};

module.exports = {
  info: (msg, meta) => log("info", msg, meta),
  warn: (msg, meta) => log("warn", msg, meta),
  error: (msg, meta) => log("error", msg, meta),
  debug: (msg, meta) => log("debug", msg, meta),
};
