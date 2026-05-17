require('dotenv').config();
const midtransClient = require('midtrans-client');

const baseClientKey = process.env.MIDTRANS_CLIENT_KEY || '';
const baseServerKey = process.env.MIDTRANS_SERVER_KEY || '';
const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function variants(value) {
  const out = new Set([value]);
  if (!value) return [];

  const replacements = [
    ['I', 'l'],
    ['l', 'I'],
    ['B', 'b'],
    ['b', 'B'],
    ['0', 'O'],
    ['O', '0'],
    ['1', 'l'],
    ['1', 'I'],
  ];

  for (const [from, to] of replacements) {
    if (value.includes(from)) out.add(value.replace(from, to));
  }

  return [...out];
}

const clientCandidates = uniq(variants(baseClientKey));
const serverCandidates = uniq(variants(baseServerKey));

async function testPair(clientKey, serverKey) {
  const snap = new midtransClient.Snap({
    isProduction,
    clientKey,
    serverKey,
  });

  const parameter = {
    transaction_details: {
      order_id: `CHECK-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      gross_amount: 10000,
    },
    item_details: [
      {
        id: 'CHECK-01',
        price: 10000,
        quantity: 1,
        name: 'Midtrans Connectivity Check',
      },
    ],
    customer_details: {
      first_name: 'Codex',
      email: 'codex@example.com',
      phone: '081234567890',
    },
  };

  try {
    const result = await snap.createTransaction(parameter);
    return {
      ok: true,
      clientKey,
      serverKey,
      token: result.token,
      redirectUrl: result.redirect_url,
    };
  } catch (err) {
    return {
      ok: false,
      clientKey,
      serverKey,
      error: err?.ApiResponse?.error_messages?.join(' ') || err.message,
    };
  }
}

(async () => {
  console.log('Midtrans check starting...');
  console.log(`Mode: ${isProduction ? 'production' : 'sandbox'}`);
  console.log(`Client candidates: ${clientCandidates.length}`);
  console.log(`Server candidates: ${serverCandidates.length}`);

  const results = [];
  for (const clientKey of clientCandidates) {
    for (const serverKey of serverCandidates) {
      const result = await testPair(clientKey, serverKey);
      results.push(result);
      const suffix = `client=${clientKey} | server=${serverKey}`;
      if (result.ok) {
        console.log(`SUCCESS: ${suffix}`);
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
      }
      console.log(`FAILED: ${suffix}`);
      console.log(`  -> ${result.error}`);
    }
  }

  console.log('\nNo working key combination found.');
  console.log(JSON.stringify(results, null, 2));
  process.exit(1);
})();

