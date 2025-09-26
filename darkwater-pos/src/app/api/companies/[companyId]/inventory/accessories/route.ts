import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { AccessoriesInventoryModel } from '@/lib/models/AccessoriesInventory';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
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

    // Get accessories inventory for this company from company-specific collection
    const collectionName = `${company.slug}_accessoriesInventory`;
    const accessories = await db.collection(collectionName).find({}).toArray();
    
    // Calculate basic stats - total is sum of all stock levels, not just count of items
    const total = accessories.reduce((sum, acc) => sum + (acc.stock || 0), 0);
    const types = accessories.length; // Count total number of accessories (cards)
    const lowStock = accessories.filter(acc => acc.status === 'Low Stock').length; // Count accessories with Low Stock status
    const outOfStock = accessories.filter(acc => acc.status === 'Out of Stock').length; // Count accessories with Out of Stock status
    
    const stats = { total, types, lowStock, outOfStock };

    return NextResponse.json({
      success: true,
      accessories,
      stats,
      company: {
        _id: company._id,
        name: company.name,
        slug: company.slug,
        type: company.type
      }
    });
  } catch (error) {
    console.error('Error fetching accessories inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch accessories inventory' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
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

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.category || !body.brand || !body.stock) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert price and priceAcquired to numbers, remove $ symbol
    const price = parseFloat(body.price?.replace(/[$,]/g, '') || '0');
    const priceAcquired = parseFloat(body.priceAcquired?.replace(/[$,]/g, '') || '0');

    // Prepare accessory data
    const accessoryData = {
      companyId: company._id,
      name: body.name,
      category: body.category,
      price: price,
      priceAcquired: priceAcquired, // Add this field to save priceAcquired
      status: body.status || 'Available',
      sku: body.sku || `${body.category.substring(0, 3).toUpperCase()}-${Date.now()}`,
      stock: parseInt(body.stock),
      brand: body.brand,
      description: body.description || '',
      compatibleModels: body.compatibleModels || [],
      images: body.images || [],
      supplier: body.supplier || '',
      minimumStock: body.minimumStock || 5,
      weight: body.weight || '',
      dimensions: body.dimensions || ''
    };

    // Create the accessory using the model
    const newAccessory = await AccessoriesInventoryModel.create(db, company.slug, accessoryData);

    return NextResponse.json({
      success: true,
      accessory: newAccessory,
      message: 'Accessory added successfully'
    });

  } catch (error) {
    console.error('Error adding accessory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add accessory' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
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

    const body = await request.json();
    const accessoryId = body._id;
    
    if (!accessoryId) {
      return NextResponse.json(
        { success: false, error: 'Accessory ID is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.name || !body.category || !body.brand || !body.stock) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert price and priceAcquired to numbers, remove $ symbol
    const price = parseFloat(body.price?.replace(/[$,]/g, '') || '0');
    const priceAcquired = parseFloat(body.priceAcquired?.replace(/[$,]/g, '') || '0');

    // Prepare update data
    const updateData = {
      name: body.name,
      category: body.category,
      price: price,
      priceAcquired: priceAcquired,
      status: body.status || 'Available',
      stock: parseInt(body.stock),
      brand: body.brand,
      description: body.description || '',
      updatedAt: new Date()
    };

    // Update the accessory using the model
    const success = await AccessoriesInventoryModel.update(db, company.slug, accessoryId, updateData);

    if (success) {
      // Get the updated accessory
      const updatedAccessory = await AccessoriesInventoryModel.findById(db, company.slug, accessoryId);
      
      return NextResponse.json({
        success: true,
        accessory: updatedAccessory,
        message: 'Accessory updated successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to update accessory' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error updating accessory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update accessory' },
      { status: 500 }
    );
  }
}
