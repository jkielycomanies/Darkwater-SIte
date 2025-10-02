import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

// GET - Fetch all transactions for a company
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const client = await clientPromise;
    const db = client.db('darkwater-pos');
    const { companyId } = await params;

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
    const transactions = await db.collection(collectionName)
      .find({})
      .sort({ date: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      transactions: transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// POST - Create a new transaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('darkwater-pos');
    const { companyId } = await params;

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
    
    // Create transaction with proper structure
    const transaction = {
      ...body,
      companyId: companyId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection(collectionName).insertOne(transaction);
    
    // Return the created transaction with the MongoDB _id
    const createdTransaction = {
      ...transaction,
      _id: result.insertedId.toString()
    };

    return NextResponse.json({
      success: true,
      transaction: createdTransaction
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
