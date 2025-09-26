import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ accountId: string }> }) {
  try {
    const accountId = params.accountId;
    const baseUrl = process.env.CHASE_DEMO_SERVICE_BASE_URL || 'https://apidemo.chase.com/mock/jpmc/servicing/inquiry-maintenance/fdx/v4';
    const playgroundToken = process.env.CHASE_PLAYGROUND_ID_TOKEN;
    const authorization = process.env.CHASE_DEMO_AUTH || 'commododolore';

    if (!playgroundToken) {
      return NextResponse.json({
        status: 200,
        data: {
          note: 'CHASE_PLAYGROUND_ID_TOKEN not configured. Returning empty payment-networks for demo.',
          paymentNetworks: []
        }
      });
    }

    const url = `${baseUrl}/accounts/${encodeURIComponent(accountId)}/payment-networks`;
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


