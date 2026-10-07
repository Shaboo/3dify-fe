const http = require("node:http");
const server = http.createServer(async (request, response) => {
  response.setHeader("Content-Type", "application/json");
  if (request.url === "/dashboard/test-fixture")
    return response.end(
      JSON.stringify({ fixture: "3dify-website-regression" }),
    );
  if (request.url === "/public/plans") return response.end(JSON.stringify([]));
  if (request.url !== "/api/v1/generate") {
    response.statusCode = 404;
    return response.end(
      JSON.stringify({ message: "Fixture endpoint missing" }),
    );
  }
  if (!request.headers["x-api-key"]) {
    response.statusCode = 401;
    return response.end(JSON.stringify({ message: "API key required" }));
  }
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  response.statusCode = 202;
  response.end(
    JSON.stringify({
      jobId: "fixture-job",
      status: "PENDING",
      byteCount: body.length,
      imageParts: (body.toString("latin1").match(/name="images"/g) || [])
        .length,
      hasApiKey: !!request.headers["x-api-key"],
      hasBearer: !!request.headers.authorization,
      contentType: request.headers["content-type"],
    }),
  );
});
server.listen(Number(process.env.FIXTURE_PORT || 3101), "127.0.0.1");
process.on("SIGTERM", () => server.close());
