import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ companyId: string; bikeId: string }> }
) {
  try {
    const client = await clientPromise;
    const db = client.db('darkwater-pos');
    const { companyId, bikeId } = params;

    // Verify company exists
    const company = await db.collection('companies').findOne({ slug: companyId });
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Verify bike exists
    const bike = await db.collection(`${company.slug}_bikeInventory`).findOne({ _id: new ObjectId(bikeId) });
    if (!bike) {
      return NextResponse.json(
        { success: false, error: 'Bike not found' },
        { status: 404 }
      );
    }

    // Get parts that are specifically associated with this bike
    const collectionName = `${company.slug}_parts`;
    const bikeParts = await db.collection(collectionName).find({
      bikeId: new ObjectId(bikeId),
      companyId: company._id
    }).toArray();

    return NextResponse.json({
      success: true,
      parts: bikeParts,
      bike: {
        _id: bike._id,
        name: bike.name || `${bike.make} ${bike.model}`,
        brand: bike.make || bike.brand,
        model: bike.model,
        vin: bike.vin
      },
      company: {
        _id: company._id,
        name: company.name,
        slug: company.slug,
        type: company.type
      }
    });
  } catch (error) {
    console.error('Error fetching bike parts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bike parts' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ companyId: string; bikeId: string }> }
) {
  try {
    const client = await clientPromise;
    const db = client.db('darkwater-pos');
    const { companyId, bikeId } = params;
    const body = await request.json();

    // Verify company exists
    const company = await db.collection('companies').findOne({ slug: companyId });
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Verify bike exists
    const bike = await db.collection(`${company.slug}_bikeInventory`).findOne({ _id: new ObjectId(bikeId) });
    if (!bike) {
      return NextResponse.json(
        { success: false, error: 'Bike not found' },
        { status: 404 }
      );
    }

    // Add bike-specific information to the part
    const partData = {
      ...body,
      companyId: company._id,
      bikeId: new ObjectId(bikeId),
      compatibleModels: body.compatibleModels || [`${bike.make || bike.brand} ${bike.model}`],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create part in company-specific collection
    const collectionName = `${company.slug}_parts`;
    const result = await db.collection(collectionName).insertOne(partData);
    const newPart = { ...partData, _id: result.insertedId };

    return NextResponse.json({
      success: true,
      part: newPart
    });
  } catch (error) {
    console.error('Error creating bike part:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create bike part' },
      { status: 500 }
    );
  }
}

