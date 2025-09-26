import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; bikeId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId, bikeId } = await params;
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

    // Verify bike exists
    const bike = await db.collection(`${company.slug}_bikeInventory`).findOne({ _id: new ObjectId(bikeId) });
    if (!bike) {
      return NextResponse.json(
        { success: false, error: 'Bike not found' },
        { status: 404 }
      );
    }

    // Get the form data with the image
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Convert the file to base64 for storage in MongoDB
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    
    // Create image object with metadata
    const imageData = {
      data: base64Image,
      contentType: imageFile.type,
      filename: imageFile.name,
      size: imageFile.size,
      uploadedAt: new Date()
    };

    // Update the bike with the new image data (add to images array)
    await db.collection(`${company.slug}_bikeInventory`).updateOne(
      { _id: new ObjectId(bikeId) },
      { 
        $push: { 
          images: imageData as any
        },
        $set: { 
          updatedAt: new Date()
        } 
      }
    );

    console.log(`✅ Image uploaded for bike ${bikeId} in ${company.slug}`);

    return NextResponse.json({
      success: true,
      imageUrl: `data:${imageData.contentType};base64,${imageData.data}`,
      imageData: imageData,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; bikeId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId, bikeId } = await params;
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

    // Verify bike exists
    const bike = await db.collection(`${company.slug}_bikeInventory`).findOne({ _id: new ObjectId(bikeId) });
    if (!bike) {
      return NextResponse.json(
        { success: false, error: 'Bike not found' },
        { status: 404 }
      );
    }

    // Remove the image data from the bike's images array
    const { imageData } = await request.json();
    
    await db.collection(`${company.slug}_bikeInventory`).updateOne(
      { _id: new ObjectId(bikeId) },
      { 
        $pull: { images: imageData },
        $set: { updatedAt: new Date() }
      }
    );

    console.log(`✅ Image removed for bike ${bikeId} in ${company.slug}`);

    return NextResponse.json({
      success: true,
      message: 'Image removed successfully'
    });
  } catch (error) {
    console.error('Error removing image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove image' },
      { status: 500 }
    );
  }
}
