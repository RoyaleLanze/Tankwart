// Runs once before the test workers start, so they inherit the time zone. Setting process.env.TZ
// inside a test file has no effect in Jest. Fixed to the time zone of the users (and not UTC, as
// in CI), so tests around midnight catch code that uses UTC dates by mistake.
module.exports = () => {
  process.env.TZ = "Europe/Berlin";
};
