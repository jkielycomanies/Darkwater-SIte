import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
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

    // Get bike inventory for this company from company-specific collection
    const collectionName = `${company.slug}_bikeInventory`;
    const bikes = await db.collection(collectionName).find({}).toArray();

    // Helper to coerce currency/number-like fields
    const toNumber = (v: any): number => {
      if (v === null || v === undefined) return 0;
      if (typeof v === 'number') return isFinite(v) ? v : 0;
      if (typeof v === 'string') {
        const n = Number(v.replace(/[$,]/g, ''));
        return isFinite(n) ? n : 0;
      }
      return 0;
    };

    // Compute and persist actualProfit for sold bikes when derivable
    for (const b of bikes) {
      const statusStr = String(b.status || '').trim().toLowerCase();
      const isSold = statusStr === 'sold';
      const hasStored = b.actualProfit !== undefined && b.actualProfit !== null && !isNaN(Number(b.actualProfit));
      if (!isSold) continue;

      // Sum costs: acquisition + parts + services + transportation
      const parts = Array.isArray(b.parts) ? b.parts.reduce((s: number, p: any) => s + toNumber(p?.cost), 0) : 0;
      const services = Array.isArray(b.services) ? b.services.reduce((s: number, p: any) => s + toNumber(p?.cost), 0) : 0;
      const transport = Array.isArray(b.transportation) ? b.transportation.reduce((s: number, p: any) => s + toNumber(p?.cost), 0) : 0;
      const acquisition = toNumber(
        b.acquisitionPrice || b.purchasePrice || b.boughtFor || b.acquiredPrice || b.cost || 0
      );
      const totalCosts = parts + services + transport + acquisition;
      const sale = toNumber(b.actualSalePrice || b.soldPrice || b.salePrice || b.sellingPrice || 0);
      const computedProfit = sale - totalCosts;

      // Persist if missing or out-of-sync
      if (!hasStored || toNumber(b.actualProfit) !== computedProfit) {
        await db.collection(collectionName).updateOne(
          { _id: b._id },
          { $set: { actualProfit: computedProfit, updatedAt: new Date() } }
        );
        // also reflect on in-memory object so response includes it
        b.actualProfit = computedProfit;
      }
    }
    
    // Calculate basic stats
    const total = bikes.length;
    const available = bikes.filter(bike => String(bike.status).toLowerCase() === 'available').length;
    const sold = bikes.filter(bike => String(bike.status).toLowerCase() === 'sold').length;
    const pending = bikes.filter(bike => String(bike.status).toLowerCase() === 'pending').length;
    
    const stats = { total, available, sold, pending };

    return NextResponse.json({
      success: true,
      bikes,
      stats,
      company: {
        _id: company._id,
        name: company.name,
        slug: company.slug,
        type: company.type
      }
    });
  } catch (error) {
    console.error('Error fetching bike inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bike inventory' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const client = await clientPromise;
    const db = client.db('darkwater-pos');
    const { companyId } = await params;
    const body = await request.json();

    // Verify company exists
    const company = await db.collection('companies').findOne({ slug: companyId });
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Create bike data with company ID and proper formatting
    const bikeData = {
      ...body,
      companyId: company._id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: body.status || 'available'
    };

    // Store dates as strings exactly as provided
    if (body.dateAcquired) {
      bikeData.dateAcquired = body.dateAcquired;
    }
    if (body.dateSold) {
      bikeData.dateSold = body.dateSold;
    }

    // Create bike in company-specific collection (e.g., "revani_bikeInventory")
    const collectionName = `${company.slug}_bikeInventory`;
    const result = await db.collection(collectionName).insertOne(bikeData);
    
    const newBike = { ...bikeData, _id: result.insertedId };

    console.log(`✅ Created bike in ${collectionName}:`, newBike.make, newBike.model);

    return NextResponse.json({
      success: true,
      bike: newBike,
      message: `Bike added to ${company.slug}_bikeInventory collection`
    });
  } catch (error) {
    console.error('Error creating bike:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create bike' },
      { status: 500 }
    );
  }
}
