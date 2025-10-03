import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; bikeId: string }> }
) {
  try {
    const { companyId, bikeId } = await params;
    const evaluationData = await request.json();

    // Saving evaluation data

    const client = await clientPromise;
    const db = client.db('darkwater-pos');

    // Verify company exists
    const company = await db.collection('companies').findOne({ slug: companyId });
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Get the collection name
    const collectionName = `${company.slug}_bikeInventory`;

    // Verify bike exists
    const existingBike = await db.collection(collectionName).findOne({ _id: new ObjectId(bikeId) });
    if (!existingBike) {
      return NextResponse.json(
        { success: false, error: 'Bike not found' },
        { status: 404 }
      );
    }

    // Prepare the evaluation data to save
    const updateData = {
      'Service Required': evaluationData.serviceRequired || [],
      'Parts Requested': evaluationData.partsRequested || [],
      'evaluationDate': new Date().toISOString(),
      'evaluatedBy': evaluationData.evaluatedBy || 'Unknown',
      updatedAt: new Date()
    };

    // Saving evaluation data

    // Update the bike document with evaluation data
    const result = await db.collection(collectionName).updateOne(
      { _id: new ObjectId(bikeId) },
      { $set: updateData }
    );

    // Update completed

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Bike not found' },
        { status: 404 }
      );
    }

    // Evaluation saved successfully
    return NextResponse.json({
      success: true,
      message: 'Evaluation saved successfully',
      evaluation: updateData
    });

  } catch (error) {
    console.error('❌ Error saving evaluation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save evaluation' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; bikeId: string }> }
) {
  try {
    const { companyId, bikeId } = await params;

    console.log('=== FETCHING EVALUATION ===');
    console.log('Company:', companyId);
    console.log('Bike ID:', bikeId);

    const client = await clientPromise;
    const db = client.db('darkwater-pos');

    // Verify company exists
    const company = await db.collection('companies').findOne({ slug: companyId });
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Get the collection name
    const collectionName = `${company.slug}_bikeInventory`;

    // Get the bike document with evaluation data
    const bike = await db.collection(collectionName).findOne(
      { _id: new ObjectId(bikeId) },
      { projection: { 'Service Required': 1, 'Parts Requested': 1, evaluationDate: 1, evaluatedBy: 1 } }
    );

    if (!bike) {
      return NextResponse.json(
        { success: false, error: 'Bike not found' },
        { status: 404 }
      );
    }

    // Convert the data to the format expected by the frontend
    const evaluationData = {
      serviceRequired: bike['Service Required'] || [],
      partsRequested: bike['Parts Requested'] || [],
      evaluatedAt: bike.evaluationDate || null,
      evaluatedBy: bike.evaluatedBy || null
    };

    console.log('Returning evaluation data:', evaluationData);

    return NextResponse.json({
      success: true,
      evaluation: evaluationData
    });

  } catch (error) {
    console.error('❌ Error fetching evaluation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch evaluation' },
      { status: 500 }
    );
  }
}
