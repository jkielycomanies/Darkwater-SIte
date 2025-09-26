import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Image compression utility
async function compressImages(images: any[]) {
  const compressedImages = [];
  
  for (const image of images) {
    if (image.data && image.contentType) {
      try {
        // Convert base64 to buffer
        const buffer = Buffer.from(image.data, 'base64');
        
        // If image is larger than 1MB, compress it
        if (buffer.length > 1024 * 1024) {
          // For now, we'll just limit the size by reducing quality
          // In a production app, you'd want to use a proper image compression library
          const maxSize = 800 * 600; // Max pixels
          const currentPixels = buffer.length / 4; // Rough estimate
          
          if (currentPixels > maxSize) {
            // Reduce the base64 data size by taking a subset
            const compressionRatio = Math.sqrt(maxSize / currentPixels);
            const newData = image.data.substring(0, Math.floor(image.data.length * compressionRatio));
            
            compressedImages.push({
              ...image,
              data: newData,
              size: Math.floor(buffer.length * compressionRatio)
            });
          } else {
            compressedImages.push(image);
          }
        } else {
          compressedImages.push(image);
        }
      } catch (error) {
        console.error('Error compressing image:', error);
        // If compression fails, keep original
        compressedImages.push(image);
      }
    } else {
      compressedImages.push(image);
    }
  }
  
  return compressedImages;
}

export async function GET(
  request: Request,
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

    // Get specific bike from company collection
    const collectionName = `${company.slug}_bikeInventory`;
    const bike = await db.collection(collectionName).findOne({ _id: new ObjectId(bikeId) });
    
    if (!bike) {
      return NextResponse.json(
        { success: false, error: 'Bike not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Retrieved bike details: ${bike.name || bike.make + ' ' + bike.model}`);

    return NextResponse.json({
      success: true,
      bike,
      company: {
        _id: company._id,
        name: company.name,
        slug: company.slug,
        type: company.type
      }
    });
  } catch (error) {
    console.error('Error fetching bike details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bike details' },
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
    const { companyId, bikeId } = await params;
    
    // Check content length before parsing
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 4 * 1024 * 1024) { // 4MB limit
      return NextResponse.json(
        { success: false, error: 'Request payload too large. Please compress images before uploading.' },
        { status: 413 }
      );
    }
    
    let updateData;
    try {
      updateData = await request.json();
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON data or payload too large' },
        { status: 400 }
      );
    }
    
    // Compress images if they exist and are too large
    if (updateData.images && Array.isArray(updateData.images)) {
      updateData.images = await compressImages(updateData.images);
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
    const collectionName = `${company.slug}_bikeInventory`;
    const existingBike = await db.collection(collectionName).findOne({ _id: new ObjectId(bikeId) });
    
    if (!existingBike) {
      return NextResponse.json(
        { success: false, error: 'Bike not found' },
        { status: 404 }
      );
    }

    // Remove fields that shouldn't be updated via this endpoint
    const { _id, createdAt, ...updateFields } = updateData;

    // Add updatedAt timestamp
    updateFields.updatedAt = new Date();

    // Store dates as strings exactly as provided
    // No conversion needed - just store the raw input

    // Update bike in the company-specific collection
    const result = await db.collection(collectionName).updateOne(
      { _id: new ObjectId(bikeId) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to update bike' },
        { status: 500 }
      );
    }

    // Fetch the updated bike to return it
    const updatedBike = await db.collection(collectionName).findOne({ _id: new ObjectId(bikeId) });

    console.log(`✅ Updated bike: ${updatedBike?.name || updatedBike?.make + ' ' + updatedBike?.model}`);

    return NextResponse.json({
      success: true,
      bike: updatedBike,
      message: `Bike updated in ${company.slug}_bikeInventory collection`
    });
  } catch (error) {
    console.error('Error updating bike:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update bike' },
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
    const { companyId, bikeId } = await params;

    // Verify company exists
    const company = await db.collection('companies').findOne({ slug: companyId });
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Verify bike exists before deletion
    const collectionName = `${company.slug}_bikeInventory`;
    const existingBike = await db.collection(collectionName).findOne({ _id: new ObjectId(bikeId) });
    
    if (!existingBike) {
      return NextResponse.json(
        { success: false, error: 'Bike not found' },
        { status: 404 }
      );
    }

    // Delete the bike from the company-specific collection
    const result = await db.collection(collectionName).deleteOne({ _id: new ObjectId(bikeId) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete bike' },
        { status: 500 }
      );
    }

    console.log(`✅ Deleted bike: ${existingBike.name || existingBike.make + ' ' + existingBike.model} from ${collectionName}`);

    return NextResponse.json({
      success: true,
      message: `Bike successfully deleted from ${company.slug}_bikeInventory collection`,
      deletedBike: {
        _id: existingBike._id,
        name: existingBike.name || `${existingBike.make} ${existingBike.model}`,
      }
    });
  } catch (error) {
    console.error('Error deleting bike:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete bike' },
      { status: 500 }
    );
  }
}

