import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const baseUrl = process.env.CHASE_DEMO_SERVICE_BASE_URL || 'https://apidemo.chase.com/mock/jpmc/servicing/inquiry-maintenance/fdx/v4';
    const playgroundToken = process.env.CHASE_PLAYGROUND_ID_TOKEN;
    const authorization = process.env.CHASE_DEMO_AUTH || 'sitcillumsintmagnaproident';

    if (!playgroundToken) {
      return NextResponse.json({
        status: 200,
        data: {
          note: 'CHASE_PLAYGROUND_ID_TOKEN not configured. Returning mock accounts payload for demo.',
          accounts: []
        }
      });
    }

    const url = `${baseUrl}/accounts`;
    const upstream = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'authorization': authorization,
        'playground-id-token': playgroundToken
      }
    });

    const data = await upstream.json().catch(async () => ({ raw: await upstream.text() }));
    return NextResponse.json({ status: upstream.status, data });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}


