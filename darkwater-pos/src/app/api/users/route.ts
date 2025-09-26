import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('darkwater-pos');
    
    // Fetch all users from the users collection
    const users = await db.collection('users').find({}).toArray();
    
    console.log(`Found ${users.length} users in database`);
    
    return NextResponse.json({ 
      success: true, 
      users: users.map(user => ({
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        companyAccess: user.companyAccess || [],
        permissions: user.permissions,
        status: user.status,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db('darkwater-pos');
    
    const userData = await request.json();
    
    // Hash password if provided
    let passwordHash = null;
    if (userData.password) {
      passwordHash = await bcrypt.hash(userData.password, 12);
      console.log('Password hashed for user:', userData.email, 'Hash length:', passwordHash.length);
    } else {
      console.log('No password provided for user:', userData.email);
    }

    // Create new user
    const newUser = {
      name: userData.name,
      email: userData.email.toLowerCase(), // Ensure consistent case
      ...(passwordHash && { passwordHash }),
      role: userData.role || 'Viewer',
      companyAccess: userData.companyAccess || [],
      permissions: userData.permissions || {
        // Main Dashboard Access
        dashboard: false,
        
        // Inventory Section (inventory auto-calculated from sub-pages)
        inventory: false,
        bikeInventory: false,
        partsInventory: false,
        accessoriesInventory: false,
        
        // Service Center Section (serviceCenter auto-calculated from sub-pages)
        serviceCenter: false,
        evaluation: false,
        serviceManager: false,
        
        // Financial Section (financial auto-calculated from sub-pages)
        financial: false,
        financialDashboard: false,
        transactions: false,
        
        // Tools Section (tools auto-calculated from sub-pages)
        tools: false,
        massImport: false,
        vinRunner: false,
        
        // Archives Section (archives auto-calculated from sub-pages)
        archives: false,
        soldBikes: false,
        
        // Other Pages
        cms: false,
        users: false,
        media: false,
        profile: false
      },
      status: userData.status || 'Active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(newUser);
    
    console.log('✅ User created with ID:', result.insertedId);
    
    return NextResponse.json({ 
      success: true, 
      message: 'User created successfully',
      userId: result.insertedId
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
