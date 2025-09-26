import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

type AddressLike = { name?: string | null; address?: string | null };

function mapAddr(list?: AddressLike[] | null) {
  return (list || []).map(a => ({ name: a?.name || null, address: a?.address || null }));
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sinceHoursParam = url.searchParams.get('sinceHours');
  const sinceHours = Number.isFinite(Number(sinceHoursParam)) && Number(sinceHoursParam) > 0 ? Number(sinceHoursParam) : 24;

  const host = process.env.GMAIL_IMAP_HOST || 'imap.gmail.com';
  const port = Number(process.env.GMAIL_IMAP_PORT || 993);
  const secure = String(process.env.GMAIL_IMAP_SECURE || 'true').toLowerCase() === 'true';
  const user = process.env.GMAIL_IMAP_USER;
  const pass = process.env.GMAIL_IMAP_PASS;
  const mailbox = process.env.GMAIL_IMAP_FOLDER || 'INBOX';

  if (!user || !pass) {
    return NextResponse.json({ error: 'GMAIL_IMAP_USER or GMAIL_IMAP_PASS not configured' }, { status: 500 });
  }

  const client = new ImapFlow({
    host,
    port,
    secure,
    auth: { user, pass },
    logger: false
  });

  const sinceDate = new Date(Date.now() - sinceHours * 60 * 60 * 1000);

  try {
    await client.connect();
    await client.mailboxOpen(mailbox);

    const uids = await client.search({ since: sinceDate });

    const emails: any[] = [];
    for await (const msg of client.fetch(uids as any, { uid: true, envelope: true, flags: true, internalDate: true, source: true })) {
      const env = msg.envelope || {} as any;
      let text: string | null = null;
      let html: string | null = null;
      try {
        if (msg.source) {
          const parsed = await simpleParser(msg.source as Buffer);
          text = parsed.text || null;
          html = parsed.html ? (typeof parsed.html === 'string' ? parsed.html : null) : null;
        }
      } catch {}
      emails.push({
        provider: 'gmail',
        mailbox,
        uid: msg.uid,
        messageId: env.messageId || null,
        subject: env.subject || '',
        from: mapAddr(env.from),
        to: mapAddr(env.to),
        cc: mapAddr(env.cc),
        bcc: mapAddr(env.bcc),
        date: msg.internalDate || null,
        flags: Array.from(msg.flags || []),
        fetchedAt: new Date(),
        text,
        html
      });
    }

    const clientMongo = await clientPromise;
    const db = clientMongo.db('darkwater-pos');
    const coll = db.collection('emails');

    let inserted = 0;
    for (const e of emails) {
      const res = await coll.updateOne(
        { provider: e.provider, mailbox: e.mailbox, uid: e.uid },
        { $setOnInsert: { createdAt: new Date() }, $set: { ...e, updatedAt: new Date() } },
        { upsert: true }
      );
      if (res.upsertedCount > 0) inserted += 1;
    }

    await client.logout();

    return NextResponse.json({ status: 200, synced: emails.length, inserted }, { status: 200 });
  } catch (err: any) {
    try { await client.logout(); } catch {}
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}


