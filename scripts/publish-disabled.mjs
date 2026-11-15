// Keep the ambiguous legacy entrypoint disabled. Publication must name its
// intended stable or beta channel and still pass the shared release preflight.
console.error('BLOCKED: use npm:publish:stable for an approved stable release or npm:publish:beta for an approved prerelease. Both require the release preflight.');
process.exitCode = 1;
