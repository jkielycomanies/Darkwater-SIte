import { ObjectId, Db } from 'mongodb';

export interface ICompany {
  _id?: ObjectId;
  slug: string;
  name: string;
  type: 'dealership' | 'software' | 'holding';
  createdAt: Date;
  updatedAt: Date;
}

export class CompanyModel {
  static collectionName = 'companies';

  static async create(db: Db, companyData: Omit<ICompany, '_id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date();
    const company: ICompany = {
      ...companyData,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection(this.collectionName).insertOne(company);
    return { ...company, _id: result.insertedId };
  }

  static async findOne(db: Db, filter: Partial<ICompany>) {
    return await db.collection(this.collectionName).findOne(filter);
  }

  static async find(db: Db, filter: Partial<ICompany> = {}) {
    return await db.collection(this.collectionName).find(filter).toArray();
  }

  static async findById(db: Db, id: string) {
    return await db.collection(this.collectionName).findOne({ _id: new ObjectId(id) });
  }

  static async findBySlug(db: Db, slug: string) {
    return await db.collection(this.collectionName).findOne({ slug });
  }
}

export default CompanyModel; 