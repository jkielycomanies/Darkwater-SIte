import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Test MongoDB connection
    const client = await clientPromise;
    const db = client.db('darkwater-pos');
    
    // Test basic operations
    await db.admin().ping();
    
    // Test collection access
    const collections = await db.listCollections().toArray();
    
    // Test a simple query
    const userCount = await db.collection('users').countDocuments();
    const companyCount = await db.collection('companies').countDocuments();
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return NextResponse.json({
      status: 'healthy',
      mongodb: {
        connected: true,
        responseTime: `${responseTime}ms`,
        collections: collections.length,
        stats: {
          users: userCount,
          companies: companyCount
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('MongoDB health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      mongodb: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
