import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// Very simple parsers for Chase alerts. Adjust patterns as needed.
const balanceRegex = /Ending balance[:\s]*\$?([\d,]+(?:\.\d{2})?)/i;
const transactionRegex = /(debit|credit)[:\s]*\$?([\d,]+(?:\.\d{2})?)/i;
const amountRegex = /\$([\d,]+(?:\.\d{2})?)/;

function parseAmount(s?: string | null): number | null {
  if (!s) return null;
  const m = s.match(amountRegex);
  const num = m ? m[1] : s;
  const clean = (num || '').replace(/,/g, '');
  const n = Number(clean);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sinceHours = Number.isFinite(Number(body?.sinceHours)) ? Number(body.sinceHours) : 48;
    const now = new Date();
    const sinceDate = new Date(now.getTime() - sinceHours * 60 * 60 * 1000);

    const client = await clientPromise;
    const db = client.db('darkwater-pos');
    const emails = db.collection('emails');

    const docs = await emails
      .find({ provider: 'gmail', date: { $gte: sinceDate } })
      .sort({ date: -1 })
      .limit(500)
      .toArray();

    const balances: Array<{ at: Date; amount: number; sourceId: any; subject: string }>= [];
    const transactions: Array<{ at: Date; type: 'income'|'expense'; amount: number; description: string; sourceId: any; subject: string }> = [];

    for (const d of docs) {
      const content = (d.text || '').toString();
      const subj = (d.subject || '').toString();

      // Balance extraction
      const bMatch = content.match(balanceRegex) || subj.match(balanceRegex);
      if (bMatch) {
        const amt = parseAmount(bMatch[0]);
        if (amt !== null) {
          balances.push({ at: d.date || new Date(), amount: amt, sourceId: d._id, subject: subj });
        }
      }

      // Transaction extraction
      const tMatch = content.match(transactionRegex) || subj.match(transactionRegex);
      if (tMatch) {
        const kind = tMatch[1].toLowerCase();
        const amt = parseAmount(tMatch[0]);
        if (amt !== null) {
          transactions.push({
            at: d.date || new Date(),
            type: kind === 'credit' ? 'income' : 'expense',
            amount: amt,
            description: subj || 'Chase alert',
            sourceId: d._id,
            subject: subj
          });
        }
      }
    }

    // Store derived results
    const derived = db.collection('finance_derived');
    const resultDoc = {
      createdAt: new Date(),
      sinceHours,
      counts: { balances: balances.length, transactions: transactions.length },
      balances,
      transactions
    };
    await derived.insertOne(resultDoc as any);

    return NextResponse.json({ status: 200, counts: resultDoc.counts });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}


