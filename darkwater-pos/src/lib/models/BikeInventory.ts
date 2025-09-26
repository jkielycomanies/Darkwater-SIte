import { Db, ObjectId } from 'mongodb';

export interface BikeInventory {
  _id?: ObjectId;
  companyId: ObjectId;
  name: string;
  category: string;
  price: number;
  status: 'Acquisition' | 'Evaluation' | 'Servicing' | 'Media' | 'Listed' | 'Sold';
  vin: string;
  year: number;
  mileage: string;
  brand: string;
  model: string;
  color?: string;
  description?: string;
  images?: string[];
  dateAcquired?: Date;
  dateSold?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class BikeInventoryModel {
  static getCollectionName(companySlug: string) {
    return `${companySlug}_bikeInventory`;
  }

  static async create(db: Db, companySlug: string, bikeData: Omit<BikeInventory, '_id' | 'createdAt' | 'updatedAt'>): Promise<BikeInventory> {
    const now = new Date();
    const bike: BikeInventory = {
      ...bikeData,
      createdAt: now,
      updatedAt: now
    };

    const collectionName = this.getCollectionName(companySlug);
    const result = await db.collection(collectionName).insertOne(bike);
    return { ...bike, _id: result.insertedId };
  }

  static async findByCompany(db: Db, companySlug: string): Promise<BikeInventory[]> {
    const collectionName = this.getCollectionName(companySlug);
    return await db.collection(collectionName).find({}).toArray() as BikeInventory[];
  }

  static async findById(db: Db, companySlug: string, id: string | ObjectId): Promise<BikeInventory | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const collectionName = this.getCollectionName(companySlug);
    return await db.collection(collectionName).findOne({ _id: objectId }) as BikeInventory | null;
  }

  static async update(db: Db, companySlug: string, id: string | ObjectId, updateData: Partial<BikeInventory>): Promise<boolean> {
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

  static async countByStatus(db: Db, companySlug: string): Promise<{ total: number; acquisition: number; evaluation: number; servicing: number; media: number; listed: number; sold: number }> {
    const collectionName = this.getCollectionName(companySlug);
    
    const pipeline = [
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ];

    const results = await db.collection(collectionName).aggregate(pipeline).toArray();
    
    let total = 0, acquisition = 0, evaluation = 0, servicing = 0, media = 0, listed = 0, sold = 0;
    
    results.forEach((result: any) => {
      total += result.count;
      switch (result._id) {
        case 'Acquisition':
          acquisition = result.count;
          break;
        case 'Evaluation':
          evaluation = result.count;
          break;
        case 'Servicing':
          servicing = result.count;
          break;
        case 'Media':
          media = result.count;
          break;
        case 'Listed':
          listed = result.count;
          break;
        case 'Sold':
          sold = result.count;
          break;
      }
    });

    return { total, acquisition, evaluation, servicing, media, listed, sold };
  }
}