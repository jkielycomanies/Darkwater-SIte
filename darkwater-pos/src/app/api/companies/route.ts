import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import MembershipModel from '@/lib/models/Membership';
import CompanyModel from '@/lib/models/Company';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('darkwater-pos');

    // Set up all your companies
    const companiesCollection = db.collection('companies');
    
    // Define all your companies
    const companyData = [
      {
        name: 'Revani Motorcycles',
        slug: 'revani',
        type: 'dealership',
        description: 'Motorcycle dealership and service center'
      },
      {
        name: 'Darkwater Software',
        slug: 'darkwater-software',
        type: 'software',
        description: 'Software development and technology solutions'
      },
      {
        name: 'Darkwater Holdings',
        slug: 'darkwater-holdings',
        type: 'holding',
        description: 'Investment and holding company'
      },
      {
        name: 'Below KBB',
        slug: 'jk-enterprises',
        type: 'dealership',
        description: 'Below KBB pricing and quality vehicles'
      }
    ];

    const companies = [];
    
    // Create or get each company
    for (const companyInfo of companyData) {
      let company = await companiesCollection.findOne({ slug: companyInfo.slug });
      
      if (!company) {
        const newCompany = {
          ...companyInfo,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const result = await companiesCollection.insertOne(newCompany);
        company = { ...newCompany, _id: result.insertedId };
        console.log(`✅ Created company: ${companyInfo.name}`);
      }
      
      companies.push(company);
    }

    return NextResponse.json({ companies });
  } catch (error) {
    console.error('Failed to fetch companies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
} 