import { Db, ObjectId } from 'mongodb';

export interface Service {
  _id?: ObjectId;
  companyId: ObjectId;
  bikeId: ObjectId;
  title: string;
  serviceLocation: 'In-House' | 'Out-Sourced';
  type: string;
  date: Date;
  // Always present fields (with N/A for unused)
  hours: string;        // "2.5" or "N/A"
  technician: string;   // "Mike Johnson" or "N/A"
  cost: string;         // "75.00" or "N/A"
  serviceProvider: string; // "Joe's Shop" or "N/A"
  paymentType: string;  // "Card" or "N/A"
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ServiceModel {
  static getCollectionName(companySlug: string) {
    return `${companySlug}_service`;
  }

  static async create(db: Db, companySlug: string, serviceData: Omit<Service, '_id' | 'createdAt' | 'updatedAt'>): Promise<Service> {
    try {
      console.log('=== SERVICE MODEL CREATE ===');
      console.log('Company slug:', companySlug);
      console.log('Input service data:', JSON.stringify(serviceData, null, 2));
      
      const now = new Date();
      const service: Service = {
        ...serviceData,
        createdAt: now,
        updatedAt: now
      };

      console.log('Final service object:', JSON.stringify(service, null, 2));

      const collectionName = this.getCollectionName(companySlug);
      console.log('Collection name:', collectionName);
      
      const result = await db.collection(collectionName).insertOne(service);
      console.log('Insert result:', result.insertedId);
      
      return { ...service, _id: result.insertedId };
    } catch (error) {
      console.error('Error in Service.create:', error);
      throw error;
    }
  }

  static async findByBike(db: Db, companySlug: string, bikeId: string | ObjectId): Promise<Service[]> {
    const objectId = typeof bikeId === 'string' ? new ObjectId(bikeId) : bikeId;
    const collectionName = this.getCollectionName(companySlug);
    return await db.collection(collectionName).find({ bikeId: objectId }).sort({ date: -1 }).toArray() as Service[];
  }

  static async findByCompany(db: Db, companySlug: string): Promise<Service[]> {
    const collectionName = this.getCollectionName(companySlug);
    return await db.collection(collectionName).find({}).sort({ date: -1 }).toArray() as Service[];
  }

  static async findById(db: Db, companySlug: string, id: string | ObjectId): Promise<Service | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const collectionName = this.getCollectionName(companySlug);
    return await db.collection(collectionName).findOne({ _id: objectId }) as Service | null;
  }

  static async update(db: Db, companySlug: string, id: string | ObjectId, updateData: Partial<Service>): Promise<boolean> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const collectionName = this.getCollectionName(companySlug);
    const result = await db.collection(collectionName).updateOne(
      { _id: objectId },
      { $set: { ...updateData, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  static async delete(db: Db, companySlug: string, id: string | ObjectId): Promise<boolean> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const collectionName = this.getCollectionName(companySlug);
    const result = await db.collection(collectionName).deleteOne({ _id: objectId });
    return result.deletedCount > 0;
  }

  static async getTotalCostForBike(db: Db, companySlug: string, bikeId: string | ObjectId): Promise<number> {
    const objectId = typeof bikeId === 'string' ? new ObjectId(bikeId) : bikeId;
    const collectionName = this.getCollectionName(companySlug);
    
    const pipeline = [
      { $match: { bikeId: objectId } },
      { $group: { _id: null, totalCost: { $sum: '$cost' } } }
    ];

    const result = await db.collection(collectionName).aggregate(pipeline).toArray();
    return result.length > 0 ? result[0].totalCost : 0;
  }

  static async getServiceStats(db: Db, companySlug: string): Promise<{ total: number; totalCost: number; recentServices: Service[] }> {
    const collectionName = this.getCollectionName(companySlug);
    
    const totalServices = await db.collection(collectionName).countDocuments();
    
    const costPipeline = [
      { $group: { _id: null, totalCost: { $sum: '$cost' } } }
    ];
    const costResult = await db.collection(collectionName).aggregate(costPipeline).toArray();
    const totalCost = costResult.length > 0 ? costResult[0].totalCost : 0;
    
    const recentServices = await db.collection(collectionName)
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray() as Service[];
    
    return {
      total: totalServices,
      totalCost,
      recentServices
    };
  }
}
