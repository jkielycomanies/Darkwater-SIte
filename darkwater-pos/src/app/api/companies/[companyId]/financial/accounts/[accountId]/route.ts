import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// PATCH: update; DELETE: delete
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ companyId: string, accountId: string }> }) {
  try {
    const { companyId, accountId } = await params;
    const payload = await req.json();
    const updates: any = { updatedAt: new Date() };
    if (payload?.name !== undefined) updates.name = String(payload.name).trim();
    if (payload?.institution !== undefined) updates.institution = String(payload.institution).trim();
    if (payload?.accountType !== undefined) updates.accountType = String(payload.accountType);
    if (payload?.last4 !== undefined) updates.last4 = String(payload.last4).slice(-4);
    if (payload?.balance !== undefined) updates.balance = Number(payload.balance) || 0;

    const client = await clientPromise;
    const db = client.db('darkwater-pos');
    const res = await db.collection('bank_accounts').updateOne(
      { _id: new ObjectId(accountId), companyId: companyId },
      { $set: updates }
    );
    if (res.matchedCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ companyId: string, accountId: string }> }) {
  try {
    const { companyId, accountId } = await params;
    const client = await clientPromise;
    const db = client.db('darkwater-pos');
    const res = await db.collection('bank_accounts').deleteOne({ _id: new ObjectId(accountId), companyId: companyId });
    if (res.deletedCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}


