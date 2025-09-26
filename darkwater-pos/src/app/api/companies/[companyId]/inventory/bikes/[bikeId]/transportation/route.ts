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

    // Get transportation records for this specific bike
    const collectionName = `${company.slug}_transportation`;
    const transportationRecords = await db.collection(collectionName)
      .find({ bikeId: new ObjectId(bikeId) })
      .sort({ date: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      transportation: transportationRecords,
      bike: {
        _id: bike._id,
        name: bike.name || `${bike.make || bike.brand} ${bike.model}`,
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
    console.error('Error fetching bike transportation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bike transportation' },
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

    // Create transportation record with bike-specific information
    const transportationData = {
      ...body,
      companyId: company._id,
      bikeId: new ObjectId(bikeId),
      bikeName: bike.name || `${bike.make || bike.brand} ${bike.model}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create transportation record in company-specific collection
    const collectionName = `${company.slug}_transportation`;
    const result = await db.collection(collectionName).insertOne(transportationData);
    const newTransportation = { ...transportationData, _id: result.insertedId };

    return NextResponse.json({
      success: true,
      transportation: newTransportation
    });
  } catch (error) {
    console.error('Error creating bike transportation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create bike transportation' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ companyId: string; bikeId: string }> }
) {
  try {
    const client = await clientPromise;
    const db = client.db('darkwater-pos');
    const { companyId, bikeId } = params;
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Transportation ID is required' },
        { status: 400 }
      );
    }

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

    // Update transportation record
    const collectionName = `${company.slug}_transportation`;
    const result = await db.collection(collectionName).updateOne(
      { 
        _id: new ObjectId(id),
        bikeId: new ObjectId(bikeId)
      },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Transportation record not found' },
        { status: 404 }
      );
    }

    // Fetch updated transportation record
    const updatedTransportation = await db.collection(collectionName).findOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      transportation: updatedTransportation
    });
  } catch (error) {
    console.error('Error updating bike transportation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update bike transportation' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ companyId: string; bikeId: string }> }
) {
  try {
    const client = await clientPromise;
    const db = client.db('darkwater-pos');
    const { companyId, bikeId } = params;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Transportation ID is required' },
        { status: 400 }
      );
    }

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

    // Delete transportation record
    const collectionName = `${company.slug}_transportation`;
    const result = await db.collection(collectionName).deleteOne({
      _id: new ObjectId(id),
      bikeId: new ObjectId(bikeId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Transportation record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Transportation record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bike transportation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete bike transportation' },
      { status: 500 }
    );
  }
}








