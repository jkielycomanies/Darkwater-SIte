import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ companyId: string; bikeId: string; partId: string }> }
) {
  try {
    const client = await clientPromise;
    const db = client.db('darkwater-pos');
    const { companyId, bikeId, partId } = params;
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

    // Update part in company-specific collection
    const collectionName = `${company.slug}_parts`;
    const updateData = {
      ...body,
      updatedAt: new Date()
    };

    const result = await db.collection(collectionName).updateOne(
      { 
        _id: new ObjectId(partId),
        bikeId: new ObjectId(bikeId),
        companyId: company._id
      },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Part not found' },
        { status: 404 }
      );
    }

    // Get the updated part
    const updatedPart = await db.collection(collectionName).findOne({ _id: new ObjectId(partId) });

    return NextResponse.json({
      success: true,
      part: updatedPart
    });
  } catch (error) {
    console.error('Error updating bike part:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update bike part' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ companyId: string; bikeId: string; partId: string }> }
) {
  try {
    const client = await clientPromise;
    const db = client.db('darkwater-pos');
    const { companyId, bikeId, partId } = params;

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

    // Get the part before deleting (for response)
    const collectionName = `${company.slug}_parts`;
    const partToDelete = await db.collection(collectionName).findOne({ 
      _id: new ObjectId(partId),
      bikeId: new ObjectId(bikeId),
      companyId: company._id
    });

    if (!partToDelete) {
      return NextResponse.json(
        { success: false, error: 'Part not found' },
        { status: 404 }
      );
    }

    // Delete the part
    const result = await db.collection(collectionName).deleteOne({ 
      _id: new ObjectId(partId),
      bikeId: new ObjectId(bikeId),
      companyId: company._id
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Part not found or could not be deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Part deleted successfully',
      deletedPart: partToDelete
    });
  } catch (error) {
    console.error('Error deleting bike part:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete bike part' },
      { status: 500 }
    );
  }
}












