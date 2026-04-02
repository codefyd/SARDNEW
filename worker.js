export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json; charset=utf-8'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const gasUrl = env.GAS_WEB_APP_URL;
    if (!gasUrl) {
      return json({ error: 'GAS_WEB_APP_URL غير مضبوط في متغيرات Worker' }, 500, corsHeaders);
    }

    try {
      let upstreamResponse;

      if (request.method === 'GET') {
        const incoming = new URL(request.url);
        const upstream = new URL(gasUrl);

        incoming.searchParams.forEach((value, key) => {
          upstream.searchParams.set(key, value);
        });

        upstreamResponse = await fetch(upstream.toString(), {
          method: 'GET'
        });

      } else if (request.method === 'POST') {
        const rawBody = await request.text();

        upstreamResponse = await fetch(gasUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: rawBody
        });

      } else {
        return json({ error: 'الطريقة غير مدعومة' }, 405, corsHeaders);
      }

      const text = await upstreamResponse.text();

      return new Response(text, {
        status: upstreamResponse.status,
        headers: corsHeaders
      });

    } catch (error) {
      return json({ error: error.message || String(error) }, 500, corsHeaders);
    }
  }
};

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers
  });
}
