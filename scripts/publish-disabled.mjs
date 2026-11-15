// V2 is a prerelease. Keep the legacy entrypoint fail-closed instead of sending
// a prerelease to latest. The V1 maintenance branch retains its own release flow.
console.error('BLOCKED: stable/latest publishing is disabled during V2 beta preparation. Use the guarded npm:publish:beta flow only after separate release approval.');
process.exitCode = 1;
