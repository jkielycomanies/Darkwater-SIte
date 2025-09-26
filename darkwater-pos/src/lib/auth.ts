import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import clientPromise from './mongodb';

// Add connection retry mechanism
let dbConnectionRetries = 0;
const maxRetries = 3;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Use the stable MongoDB connection with HMR support
          const client = await clientPromise;
          const db = client.db('darkwater-pos');
          
          // Query the users collection directly - try both cases for compatibility
          let user = await db.collection('users').findOne({ 
            email: credentials.email.toLowerCase() 
          });
          
          // If not found with lowercase, try original case for backward compatibility
          if (!user) {
            user = await db.collection('users').findOne({ 
              email: credentials.email 
            });
          }
          
          if (!user) {
            console.log('User not found:', credentials.email);
            console.log('Available users in database:', await db.collection('users').find({}, { projection: { email: 1, name: 1 } }).toArray());
            return null;
          }

          console.log('Found user:', { email: user.email, hasPasswordHash: !!user.passwordHash });

          // Verify password
          if (!user.passwordHash) {
            console.log('User has no password hash:', credentials.email);
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
          
          if (!isPasswordValid) {
            console.log('Invalid password for:', credentials.email);
            return null;
          }

          console.log('✅ Login successful for:', user.email);
          
          // Update lastLogin timestamp
          try {
            await db.collection('users').updateOne(
              { _id: user._id },
              { 
                $set: { 
                  lastLogin: new Date(),
                  updatedAt: new Date()
                } 
              }
            );
            console.log('✅ Updated lastLogin for:', user.email);
          } catch (updateError) {
            console.error('Failed to update lastLogin:', updateError);
            // Don't fail the login if we can't update the timestamp
          }
          
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name || user.email,
            image: user.image || null,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours (in seconds)
    updateAge: 24 * 60 * 60, // 24 hours - no automatic refresh
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.loginTime = Date.now();
      }
      
      // Check if token is expired (24 hours)
      if (token.loginTime && Date.now() - (token.loginTime as number) > 24 * 60 * 60 * 1000) {
        return null; // Force re-authentication
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key',
}; 