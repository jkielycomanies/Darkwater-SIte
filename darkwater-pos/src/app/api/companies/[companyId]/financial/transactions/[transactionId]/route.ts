import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

const client = new MongoClient(uri);

// PUT - Update a transaction
export async function PUT(
  request: NextRequest,
  { params }: { params: { companyId: string; transactionId: string } }
) {
  try {
    const body = await request.json();
    
    await client.connect();
    const db = client.db('darkwater');
    const collection = db.collection('revani_transaction');

    // Update transaction
    const updateData = {
      ...body,
      updatedAt: new Date()
    };

    // Remove _id from update data to avoid conflicts
    delete updateData._id;

    const result = await collection.updateOne(
      { 
        _id: new ObjectId(params.transactionId),
        companyId: params.companyId 
      },
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
  } finally {
    await client.close();
  }
}

// DELETE - Delete a transaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: { companyId: string; transactionId: string } }
) {
  try {
    await client.connect();
    const db = client.db('darkwater');
    const collection = db.collection('revani_transaction');

    const result = await collection.deleteOne({
      _id: new ObjectId(params.transactionId),
      companyId: params.companyId
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
  } finally {
    await client.close();
  }
}
