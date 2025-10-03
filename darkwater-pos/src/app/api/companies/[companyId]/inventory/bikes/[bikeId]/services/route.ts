import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; bikeId: string }> }
) {
  try {
    const client = await clientPromise;
    const db = client.db('darkwater-pos');
    const { companyId, bikeId } = await params;

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

    // Get all services for this bike
    const services = await db.collection(`${company.slug}_service`).find({ bikeId: new ObjectId(bikeId) }).toArray();

    return NextResponse.json({
      success: true,
      services,
      bike: {
        _id: bike._id,
        name: bike.name || `${bike.make} ${bike.model}`,
        brand: bike.make,
        model: bike.model,
        vin: bike.vin
      }
    });
  } catch (error) {
    console.error('Error fetching bike services:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bike services' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; bikeId: string }> }
) {
  let body: any = {};
  try {
    const client = await clientPromise;
    const db = client.db('darkwater-pos');
    const { companyId, bikeId } = await params;
    body = await request.json();

    // Creating service for bike

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

    // Basic validation
    if (!body.title || !body.serviceLocation || !body.type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, serviceLocation, or type' },
        { status: 400 }
      );
    }

    // Create service data with uniform structure - always include all fields
    const serviceData = {
      title: body.title,
      serviceLocation: body.serviceLocation,
      type: body.type,
      companyId: company._id,
      bikeId: new ObjectId(bikeId),
      date: new Date(body.date),
      // Always save all fields - use N/A for unused ones
      hours: body.serviceLocation === 'In-House' ? (body.hours || 'N/A') : 'N/A',
      technician: body.serviceLocation === 'In-House' ? (body.technician || 'N/A') : 'N/A',
      cost: body.serviceLocation === 'Out-Sourced' ? (body.cost || 'N/A') : 'N/A',
      serviceProvider: body.serviceLocation === 'Out-Sourced' ? (body.serviceProvider || 'N/A') : 'N/A',
      paymentType: body.serviceLocation === 'Out-Sourced' ? (body.paymentType || 'Card') : 'N/A',
      notes: body.notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Service data prepared

    // Create service in company-specific collection (e.g., "revani_service")
    const result = await db.collection(`${company.slug}_service`).insertOne(serviceData);
    const newService = { ...serviceData, _id: result.insertedId };

    // Service created successfully

    return NextResponse.json({
      success: true,
      service: newService,
      message: `Service added to ${company.slug}_service collection`
    });
  } catch (error) {
    console.error('=== ERROR CREATING SERVICE ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Request body:', JSON.stringify(body, null, 2));
    
    return NextResponse.json(
      { success: false, error: `Failed to create service: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; bikeId: string }> }
) {
  try {
    const client = await clientPromise;
    const db = client.db('darkwater-pos');
    const { companyId, bikeId } = await params;
    
    // Get the service ID from the request URL
    const url = new URL(request.url);
    const serviceId = url.searchParams.get('serviceId');
    
    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: 'Service ID is required' },
        { status: 400 }
      );
    }

    // Deleting service

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
        { status: 400 }
      );
    }

    // Delete the service from the company-specific collection
    const collectionName = `${company.slug}_service`;
    const result = await db.collection(collectionName).deleteOne({ 
      _id: new ObjectId(serviceId),
      bikeId: new ObjectId(bikeId) // Ensure the service belongs to this bike
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Service not found or already deleted' },
        { status: 404 }
      );
    }

    // Service deleted successfully

    return NextResponse.json({
      success: true,
      message: `Service deleted from ${company.slug}_service collection`
    });
  } catch (error) {
    console.error('=== ERROR DELETING SERVICE ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { success: false, error: `Failed to delete service: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
