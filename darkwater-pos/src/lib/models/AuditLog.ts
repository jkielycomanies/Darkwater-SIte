import { ObjectId, Db } from 'mongodb';

export interface IAuditLog {
  _id?: ObjectId;
  companyId: ObjectId;
  userId: ObjectId;
  action: string;
  data: Record<string, unknown>;
  createdAt: Date;
}

export class AuditLogModel {
  static collectionName = 'auditlogs';

  static async create(db: Db, auditLogData: Omit<IAuditLog, '_id' | 'createdAt'>) {
    const now = new Date();
    const auditLog: IAuditLog = {
      ...auditLogData,
      createdAt: now,
    };

    const result = await db.collection(this.collectionName).insertOne(auditLog);
    return { ...auditLog, _id: result.insertedId };
  }

  static async findOne(db: Db, filter: Partial<IAuditLog>) {
    return await db.collection(this.collectionName).findOne(filter);
  }

  static async find(db: Db, filter: Partial<IAuditLog> = {}) {
    return await db.collection(this.collectionName).find(filter).toArray();
  }

  static async findByCompanyId(db: Db, companyId: string) {
    return await db.collection(this.collectionName).find({ 
      companyId: new ObjectId(companyId) 
    }).sort({ createdAt: -1 }).toArray();
  }

  static async findByUserId(db: Db, userId: string) {
    return await db.collection(this.collectionName).find({ 
      userId: new ObjectId(userId) 
    }).sort({ createdAt: -1 }).toArray();
  }
}

export default AuditLogModel; 