import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

// PUT - Update a transaction
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; transactionId: string }> }
) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('darkwater-pos');
    const { companyId, transactionId } = await params;

    // Verify company exists
    const company = await db.collection('companies').findOne({ slug: companyId });
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Use company-specific collection name
    const collectionName = `${company.slug}_transactions`;

    // Update transaction
    const updateData = {
      ...body,
      updatedAt: new Date()
    };

    // Remove _id from update data to avoid conflicts
    delete updateData._id;

    const result = await db.collection(collectionName).updateOne(
      { _id: new ObjectId(transactionId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction updated successfully'
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a transaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; transactionId: string }> }
) {
  try {
    const client = await clientPromise;
    const db = client.db('darkwater-pos');
    const { companyId, transactionId } = await params;

    // Verify company exists
    const company = await db.collection('companies').findOne({ slug: companyId });
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Use company-specific collection name
    const collectionName = `${company.slug}_transactions`;

    const result = await db.collection(collectionName).deleteOne({
      _id: new ObjectId(transactionId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
