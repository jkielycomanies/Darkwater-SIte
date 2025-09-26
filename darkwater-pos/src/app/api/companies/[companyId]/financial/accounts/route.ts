import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// GET: list accounts; POST: create account
export async function GET(_req: NextRequest, { params }: { params: Promise<{ companyId: string }> }) {
  try {
    const { companyId } = await params;
    const client = await clientPromise;
    const db = client.db('darkwater-pos');
    const accounts = await db
      .collection('bank_accounts')
      .find({ companyId: companyId })
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json({ accounts });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ companyId: string }> }) {
  try {
    const { companyId } = await params;
    const payload = await req.json();
    const now = new Date();
    const doc = {
      companyId: companyId,
      name: String(payload?.name || '').trim(),
      institution: String(payload?.institution || '').trim(),
      accountType: String(payload?.accountType || 'checking'),
      last4: payload?.last4 ? String(payload.last4).slice(-4) : undefined,
      balance: Number(payload?.balance || 0),
      createdAt: now,
      updatedAt: now
    };
    if (!doc.name) return NextResponse.json({ error: 'name required' }, { status: 400 });
    const client = await clientPromise;
    const db = client.db('darkwater-pos');
    const res = await db.collection('bank_accounts').insertOne(doc as any);
    return NextResponse.json({ account: { _id: res.insertedId, ...doc } }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}


