import { ObjectId, Db } from 'mongodb';

export interface IUser {
  _id?: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserModel {
  static collectionName = 'users';

  static async create(db: Db, userData: Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date();
    const user: IUser = {
      ...userData,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection(this.collectionName).insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  static async findOne(db: Db, filter: Partial<IUser>) {
    return await db.collection(this.collectionName).findOne(filter);
  }

  static async findById(db: Db, id: string) {
    return await db.collection(this.collectionName).findOne({ _id: new ObjectId(id) });
  }

  static async findByEmail(db: Db, email: string) {
    return await db.collection(this.collectionName).findOne({ email: email.toLowerCase() });
  }
}

export default UserModel; 