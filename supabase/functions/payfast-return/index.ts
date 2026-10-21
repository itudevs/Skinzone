const appReturnUrl = "za.co.skinzone://payment/complete";

Deno.serve((request) => {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  return new Response(
    `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Returning to Skinzone</title>
  </head>
  <body>
    <p>Returning to Skinzone...</p>
    <p><a href="${appReturnUrl}">Tap here if the app does not open</a></p>
    <script>window.location.replace("${appReturnUrl}");</script>
  </body>
</html>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
});
