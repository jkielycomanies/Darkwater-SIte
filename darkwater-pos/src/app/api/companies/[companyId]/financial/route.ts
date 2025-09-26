import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(req: NextRequest, { params }: { params: Promise<{ companyId: string }> }) {
  try {
    const client = await clientPromise;
    const db = client.db('darkwater-pos');
    const derived = db.collection('finance_derived');

    const latest = await derived.find().sort({ createdAt: -1 }).limit(1).toArray();
    const last = latest[0] || { balances: [], transactions: [] } as any;

    // Create a simplified response for the dashboard pages
    const balances = (last.balances || []).slice(0, 20);
    const transactions = (last.transactions || []).slice(0, 100);

    return NextResponse.json({ balances, transactions });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}


