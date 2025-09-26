import { ObjectId, Db } from 'mongodb';

export interface IMembership {
  _id?: ObjectId;
  userId: ObjectId;
  companyId: ObjectId;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'VIEWER';
  createdAt: Date;
}

export class MembershipModel {
  static collectionName = 'memberships';

  static async create(db: Db, membershipData: Omit<IMembership, '_id' | 'createdAt'>) {
    const now = new Date();
    const membership: IMembership = {
      ...membershipData,
      createdAt: now,
    };

    const result = await db.collection(this.collectionName).insertOne(membership);
    return { ...membership, _id: result.insertedId };
  }

  static async findOne(db: Db, filter: Partial<IMembership>) {
    return await db.collection(this.collectionName).findOne(filter);
  }

  static async find(db: Db, filter: Partial<IMembership> = {}) {
    return await db.collection(this.collectionName).find(filter).toArray();
  }

  static async findByUserId(db: Db, userId: string) {
    return await db.collection(this.collectionName).find({ 
      userId: new ObjectId(userId) 
    }).toArray();
  }

  static async findByUserIdAndCompanyId(db: Db, userId: string, companyId: string) {
    return await db.collection(this.collectionName).findOne({
      userId: new ObjectId(userId),
      companyId: new ObjectId(companyId)
    });
  }
}

export default MembershipModel; 