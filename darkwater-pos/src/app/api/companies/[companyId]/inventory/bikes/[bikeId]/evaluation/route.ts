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

    console.log('=== SAVING EVALUATION ===');
    console.log('Company:', companyId);
    console.log('Bike ID:', bikeId);
    console.log('Data:', evaluationData);

    const client = await clientPromise;
    const db = client.db('darkwater-pos');

    // Verify company exists
    const company = await db.collection('companies').findOne({ slug: companyId });
    if (!company) {
      console.log('Company not found:', companyId);
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Get the collection name
    const collectionName = `${company.slug}_bikeInventory`;
    console.log('Using collection:', collectionName);

    // Verify bike exists
    const existingBike = await db.collection(collectionName).findOne({ _id: new ObjectId(bikeId) });
    if (!existingBike) {
      console.log('Bike not found:', bikeId);
      return NextResponse.json(
        { success: false, error: 'Bike not found' },
        { status: 404 }
      );
    }

    console.log('Bike found:', existingBike.name || existingBike.make + ' ' + existingBike.model);

    // Prepare the evaluation data to save
    const updateData = {
      'Service Required': evaluationData.serviceRequired || [],
      'Parts Requested': evaluationData.partsRequested || [],
      'evaluationDate': new Date().toISOString(),
      'evaluatedBy': evaluationData.evaluatedBy || 'Unknown',
      updatedAt: new Date()
    };

    console.log('Saving evaluation data:', updateData);

    // Update the bike document with evaluation data
    const result = await db.collection(collectionName).updateOne(
      { _id: new ObjectId(bikeId) },
      { $set: updateData }
    );

    console.log('Update result:', result);

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Bike not found' },
        { status: 404 }
      );
    }

    console.log('✅ Evaluation saved successfully!');
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
