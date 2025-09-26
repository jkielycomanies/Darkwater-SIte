import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const baseUrl = process.env.CHASE_AGGREGATOR_BASE_URL || 'https://apidemo.chase.com/mock/aggregator-oauth/v1';
    const clientId = process.env.CHASE_CLIENT_ID || 'SUNSHINE_WALLET';
    const redirectUri = process.env.CHASE_REDIRECT_URI || 'showcaseApp/payment-settlement/eligible-accounts';
    const state = process.env.CHASE_STATE || 'apigeeapp';
    const scope = process.env.CHASE_SCOPE || 'aggregator';
    const playgroundToken = process.env.CHASE_PLAYGROUND_ID_TOKEN;

    if (!playgroundToken) {
      return NextResponse.json({
        status: 200,
        data: {
          note: 'CHASE_PLAYGROUND_ID_TOKEN not configured. Returning mock authorize URL for demo.',
          authorizeUrl: `${baseUrl}/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scope)}`
        }
      });
    }

    const url = `${baseUrl}/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scope)}`;

    const upstream = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'playground-id-token': playgroundToken
      }
    });

    const contentType = upstream.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await upstream.json();
      return NextResponse.json({ status: upstream.status, data });
    } else {
      const text = await upstream.text();
      return NextResponse.json({ status: upstream.status, data: text });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}


