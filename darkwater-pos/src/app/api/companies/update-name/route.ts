import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('darkwater-pos');

    // Update JK Enterprises to Below KBB
    const result = await db.collection('companies').updateOne(
      { slug: 'jk-enterprises' },
      { 
        $set: { 
          name: 'Below KBB',
          description: 'Below KBB pricing and quality vehicles',
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Company name updated successfully',
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error('Error updating company name:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}








