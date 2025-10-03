# MongoDB Atlas Configuration Guide

## 🚨 Current Issues & Solutions

### 1. IP Whitelist Configuration
Your MongoDB Atlas cluster is likely blocking connections due to IP restrictions.

**SOLUTION:**
1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Navigate to **Network Access** in the left sidebar
3. Click **Add IP Address**
4. **CRITICAL:** Add `0.0.0.0/0` to allow access from anywhere
   - This allows your site to be accessed from any location
   - For production, consider restricting to specific IP ranges

### 2. Connection String Issues
Your current connection string has some problematic parameters.

**CURRENT (PROBLEMATIC):**
```
mongodb+srv://jkiely2025:IDKLOL@cluster0.jxle3wm.mongodb.net/darkwater-pos?retryWrites=true&w=majority&ssl=true&tls=true&tlsAllowInvalidCertificates=true&tlsAllowInvalidHostnames=true
```

**RECOMMENDED:**
```
mongodb+srv://jkiely2025:IDKLOL@cluster0.jxle3wm.mongodb.net/darkwater-pos?retryWrites=true&w=majority&maxPoolSize=50&minPoolSize=5&serverSelectionTimeoutMS=10000
```

### 3. Database User Permissions
Ensure your database user has proper permissions.

**CHECK:**
1. Go to **Database Access** in MongoDB Atlas
2. Verify user `jkiely2025` has **Read and write to any database** permissions
3. If not, click **Edit** and set permissions to **Read and write to any database**

### 4. Cluster Configuration
Verify your cluster is properly configured.

**CHECK:**
1. Go to **Clusters** in MongoDB Atlas
2. Ensure cluster is **Running** (not paused)
3. Check **Connection** tab for correct connection string
4. Verify cluster tier supports your connection limits

## 🔧 Immediate Actions Required

### Step 1: Fix IP Whitelist
```bash
# Add this IP range to MongoDB Atlas Network Access:
0.0.0.0/0
```

### Step 2: Update Environment Variables
Create/update your `.env.local` file:
```env
MONGODB_URI=mongodb+srv://jkiely2025:IDKLOL@cluster0.jxle3wm.mongodb.net/darkwater-pos?retryWrites=true&w=majority&maxPoolSize=50&minPoolSize=5&serverSelectionTimeoutMS=10000
```

### Step 3: Test Connection
Visit: `https://your-domain.com/api/health/mongodb`

This will show you:
- Connection status
- Response time
- Collection counts
- Any error details

## 🚀 Performance Optimizations Applied

### Connection Pool Settings
- **maxPoolSize**: 50 (increased from 10)
- **minPoolSize**: 5 (new)
- **serverSelectionTimeoutMS**: 10000 (reduced from 30000)
- **socketTimeoutMS**: 30000 (reduced from 45000)

### Retry Logic
- **Automatic retries**: 3 attempts with exponential backoff
- **Connection testing**: Ping test on each connection
- **Error logging**: Detailed error messages for debugging

### Error Handling
- **Specific error messages** for different failure types
- **HTTP status codes** that match the error type
- **Development vs production** error details

## 🔍 Troubleshooting

### Common Error Messages & Solutions

1. **"MongoNetworkError"**
   - **Cause**: IP not whitelisted or network issues
   - **Solution**: Add `0.0.0.0/0` to IP whitelist

2. **"Authentication failed"**
   - **Cause**: Wrong username/password or insufficient permissions
   - **Solution**: Check database user permissions

3. **"Connection timeout"**
   - **Cause**: Cluster paused or connection limits exceeded
   - **Solution**: Check cluster status and upgrade if needed

4. **"Too many connections"**
   - **Cause**: Connection pool exhausted
   - **Solution**: Optimized connection pooling (already applied)

## 📊 Monitoring

### Health Check Endpoint
Use `/api/health/mongodb` to monitor:
- Connection status
- Response times
- Collection health
- Error details

### MongoDB Atlas Monitoring
1. Go to **Metrics** in MongoDB Atlas
2. Monitor **Connections** and **Operations**
3. Set up alerts for connection failures

## 🛡️ Security Recommendations

### For Production:
1. **Restrict IP ranges** instead of `0.0.0.0/0`
2. **Use environment variables** for connection strings
3. **Enable MongoDB Atlas security features**
4. **Regular security audits**

### Current Security Issues:
- ❌ Hardcoded credentials in code
- ❌ Overly permissive IP whitelist
- ❌ No connection encryption verification

## 🚨 Emergency Fix

If your site is completely down:

1. **Immediate**: Add `0.0.0.0/0` to MongoDB Atlas IP whitelist
2. **Quick**: Restart your application server
3. **Verify**: Check `/api/health/mongodb` endpoint
4. **Monitor**: Watch MongoDB Atlas metrics

## 📞 Support

If issues persist:
1. Check MongoDB Atlas status page
2. Review MongoDB Atlas logs
3. Contact MongoDB Atlas support
4. Use the health check endpoint for diagnostics
