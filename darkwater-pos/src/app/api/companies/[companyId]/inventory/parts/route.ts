import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const client = await clientPromise;
    const db = client.db('darkwater-pos');
    const { companyId } = params;

    // Verify company exists
    const company = await db.collection('companies').findOne({ slug: companyId });
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Get parts inventory for this company from company-specific collection
    const collectionName = `${company.slug}_parts`;
    const parts = await db.collection(collectionName).find({}).toArray();
    
    // Calculate basic stats
    const total = parts.length;
    const available = parts.filter(part => part.status === 'available').length;
    const installed = parts.filter(part => part.status === 'installed').length;
    const ordered = parts.filter(part => part.status === 'ordered').length;
    
    const stats = { total, available, installed, ordered };

    return NextResponse.json({
      success: true,
      parts,
      stats,
      company: {
        _id: company._id,
        name: company.name,
        slug: company.slug,
        type: company.type
      }
    });
  } catch (error) {
    console.error('Error fetching parts inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch parts inventory' },
      { status: 500 }
    );
  }
}
