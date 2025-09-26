import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = await params;
    const client = await clientPromise;
    const db = client.db('darkwater-pos');

    // Find the company by slug
    const company = await db.collection('companies').findOne({ slug: companyId });
    
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // For now, allow access to all companies for the authenticated user
    // In production, you'd implement proper membership checking
    return NextResponse.json({
      company: {
        _id: company._id?.toString(),
        slug: company.slug,
        name: company.name,
        type: company.type,
        description: company.description
      }
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


