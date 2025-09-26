import { Db, ObjectId } from 'mongodb';

export interface PartsInventory {
  _id?: ObjectId;
  companyId: ObjectId;
  name: string;
  category: string;
  price: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  partNumber: string;
  stock: number;
  brand: string;
  description?: string;
  compatibleModels?: string[];
  images?: string[];
  supplier?: string;
  minimumStock?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class PartsInventoryModel {
  static getCollectionName(companySlug: string) {
    return `${companySlug}_partsInventory`;
  }

  static async create(db: Db, companySlug: string, partData: Omit<PartsInventory, '_id' | 'createdAt' | 'updatedAt'>): Promise<PartsInventory> {
    const now = new Date();
    const part: PartsInventory = {
      ...partData,
      createdAt: now,
      updatedAt: now
    };

    const collectionName = this.getCollectionName(companySlug);
    const result = await db.collection(collectionName).insertOne(part);
    return { ...part, _id: result.insertedId };
  }

  static async findByCompany(db: Db, companySlug: string): Promise<PartsInventory[]> {
    const collectionName = this.getCollectionName(companySlug);
    return await db.collection(collectionName).find({}).toArray() as PartsInventory[];
  }

  static async findById(db: Db, companySlug: string, id: string | ObjectId): Promise<PartsInventory | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const collectionName = this.getCollectionName(companySlug);
    return await db.collection(collectionName).findOne({ _id: objectId }) as PartsInventory | null;
  }

  static async update(db: Db, companySlug: string, id: string | ObjectId, updateData: Partial<PartsInventory>): Promise<boolean> {
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

  static async updateStock(db: Db, companySlug: string, id: string | ObjectId, newStock: number): Promise<boolean> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const collectionName = this.getCollectionName(companySlug);
    
    // Determine status based on stock level
    let status: PartsInventory['status'] = 'In Stock';
    if (newStock === 0) {
      status = 'Out of Stock';
    } else if (newStock <= 5) { // You can adjust this threshold
      status = 'Low Stock';
    }

    const result = await db.collection(collectionName).updateOne(
      { _id: objectId },
      { 
        $set: { 
          stock: newStock, 
          status,
          updatedAt: new Date() 
        } 
      }
    );
    return result.modifiedCount > 0;
  }

  static async countByStatus(db: Db, companySlug: string): Promise<{ total: number; inStock: number; lowStock: number; outOfStock: number }> {
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
    
    let total = 0, inStock = 0, lowStock = 0, outOfStock = 0;
    
    results.forEach((result: any) => {
      total += result.count;
      switch (result._id) {
        case 'In Stock':
          inStock = result.count;
          break;
        case 'Low Stock':
          lowStock = result.count;
          break;
        case 'Out of Stock':
          outOfStock = result.count;
          break;
      }
    });

    return { total, inStock, lowStock, outOfStock };
  }
}
