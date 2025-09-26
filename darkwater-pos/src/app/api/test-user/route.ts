import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';

export async function POST() {
  try {
          const client = await clientPromise;
      const db = client.db('darkwater-pos');
    
    // Check if test user already exists
    const existingUser = await db.collection('users').findOne({ 
      email: 'admin@darkwater.local' 
    });
    
    if (existingUser) {
      return NextResponse.json({ 
        success: true, 
        message: 'Test user already exists',
        email: 'admin@darkwater.local'
      });
    }
    
    // Create password hash
    const passwordHash = await bcrypt.hash('ChangeMe!123', 12);
    
    // Create test user directly in users collection
    const testUser = {
      name: 'Admin User',
      email: 'admin@darkwater.local',
      passwordHash: passwordHash,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(testUser);
    
    console.log('✅ Test user created with ID:', result.insertedId);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test user created successfully',
      email: testUser.email,
      id: result.insertedId
    });
  } catch (error) {
    console.error('Error creating test user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create test user: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
