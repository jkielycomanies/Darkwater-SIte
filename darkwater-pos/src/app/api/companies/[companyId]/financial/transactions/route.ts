import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

const client = new MongoClient(uri);

// GET - Fetch all transactions for a company
export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    await client.connect();
    const db = client.db('darkwater');
    const collection = db.collection('revani_transaction');

    const transactions = await collection
      .find({ companyId: params.companyId })
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
  } finally {
    await client.close();
  }
}

// POST - Create a new transaction
export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const body = await request.json();
    
    await client.connect();
    const db = client.db('darkwater');
    const collection = db.collection('revani_transaction');

    // Create transaction with proper structure
    const transaction = {
      ...body,
      companyId: params.companyId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(transaction);
    
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
  } finally {
    await client.close();
  }
}
