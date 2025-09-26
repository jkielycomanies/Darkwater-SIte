import { Db, ObjectId } from 'mongodb';

export interface AccessoriesInventory {
  _id?: ObjectId;
  companyId: ObjectId;
  name: string;
  category: string;
  price: number;
  priceAcquired?: number; // Add priceAcquired field
  status: 'Available' | 'Low Stock' | 'Out of Stock';
  sku: string;
  stock: number;
  brand: string;
  description?: string;
  compatibleModels?: string[];
  images?: string[];
  supplier?: string;
  minimumStock?: number;
  weight?: string;
  dimensions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AccessoriesInventoryModel {
  static getCollectionName(companySlug: string) {
    return `${companySlug}_accessoriesInventory`;
  }

  static async create(db: Db, companySlug: string, accessoryData: Omit<AccessoriesInventory, '_id' | 'createdAt' | 'updatedAt'>): Promise<AccessoriesInventory> {
    const now = new Date();
    const accessory: AccessoriesInventory = {
      ...accessoryData,
      createdAt: now,
      updatedAt: now
    };

    const collectionName = this.getCollectionName(companySlug);
    const result = await db.collection(collectionName).insertOne(accessory);
    return { ...accessory, _id: result.insertedId };
  }

  static async findByCompany(db: Db, companySlug: string): Promise<AccessoriesInventory[]> {
    const collectionName = this.getCollectionName(companySlug);
    return await db.collection(collectionName).find({}).toArray() as AccessoriesInventory[];
  }

  static async findById(db: Db, companySlug: string, id: string | ObjectId): Promise<AccessoriesInventory | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const collectionName = this.getCollectionName(companySlug);
    return await db.collection(collectionName).findOne({ _id: objectId }) as AccessoriesInventory | null;
  }

  static async update(db: Db, companySlug: string, id: string | ObjectId, updateData: Partial<AccessoriesInventory>): Promise<boolean> {
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
    let status: AccessoriesInventory['status'] = 'Available';
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

  static async countByStatus(db: Db, companySlug: string): Promise<{ total: number; available: number; lowStock: number; outOfStock: number }> {
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
    
    let total = 0, available = 0, lowStock = 0, outOfStock = 0;
    
    results.forEach((result: any) => {
      total += result.count;
      switch (result._id) {
        case 'Available':
          available = result.count;
          break;
        case 'Low Stock':
          lowStock = result.count;
          break;
        case 'Out of Stock':
          outOfStock = result.count;
          break;
      }
    });

    return { total, available, lowStock, outOfStock };
  }
}
