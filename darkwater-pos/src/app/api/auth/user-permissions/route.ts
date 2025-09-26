import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('darkwater-pos');
    
    // Get user permissions from database
    const user = await db.collection('users').findOne({ 
      email: session.user.email 
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('User permissions for', session.user.email, ':', user.permissions);

    return NextResponse.json({ 
      success: true, 
      permissions: user.permissions || {},
      companyAccess: user.companyAccess || [],
      role: user.role || 'Viewer'
    });

  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user permissions' }, 
      { status: 500 }
    );
  }
}












