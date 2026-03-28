#!/bin/sh
# Start the MCP server and the Candidate API in the same container.
# The MCP server calls http://localhost:3456 for report_pattern submissions.

PORT=3456 node api/src/index.js &
TRANSPORT=sse node server/src/index.js
