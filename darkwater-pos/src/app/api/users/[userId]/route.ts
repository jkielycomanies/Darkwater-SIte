import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    const client = await clientPromise;
    const db = client.db('darkwater-pos');
    
    // Convert string ID to ObjectId for MongoDB query
    console.log('Looking for user with ID:', userId);
    let user;
    try {
      user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
      console.log('Found user with ObjectId:', user ? 'Yes' : 'No');
    } catch (error) {
      console.log('ObjectId conversion failed, trying string ID');
      // If ObjectId conversion fails, try with string ID as fallback
      user = await db.collection('users').findOne({ _id: userId });
      console.log('Found user with string ID:', user ? 'Yes' : 'No');
    }
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove sensitive data
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json({ 
      success: true, 
      user: {
        ...userWithoutPassword,
        _id: user._id.toString()
      }
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('darkwater-pos');
    
    const body = await request.json();
    const { _id, password, createdAt, ...updateData } = body;

    // Handle password update if provided
    if (password && password.trim() !== '') {
      console.log('Password update requested for user:', params.userId);
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      updateData.passwordHash = hashedPassword;
    }

    // Add updatedAt timestamp
    updateData.updatedAt = new Date();

    // Convert string ID to ObjectId for MongoDB query
    let result;
    try {
      result = await db.collection('users').updateOne(
        { _id: new ObjectId(params.userId) },
        { $set: updateData }
      );
    } catch (error) {
      console.log('ObjectId conversion failed, trying string ID');
      result = await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateData }
      );
    }

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the updated user
    let updatedUser;
    try {
      updatedUser = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    } catch (error) {
      updatedUser = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    }

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found after update' }, { status: 404 });
    }

    // Remove sensitive data
    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({ 
      success: true, 
      user: {
        ...userWithoutPassword,
        _id: updatedUser._id.toString()
      }
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
