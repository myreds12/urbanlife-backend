import { createClient } from 'redis';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testRedisStandalone() {
  console.log('🔌 Testing Redis connection (Standalone)...');

  const redisConfig = {
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      connectTimeout: 5000,
    },
    password: process.env.REDIS_PASSWORD || undefined,
  };

  console.log('📋 Redis configuration:', {
    host: redisConfig.socket.host,
    port: redisConfig.socket.port,
    hasPassword: !!redisConfig.password,
  });

  const client = createClient(redisConfig);

  // Event handlers
  client.on('error', err => {
    console.error('❌ Redis Client Error:', err.message);
  });

  client.on('connect', () => {
    console.log('🔗 Connecting to Redis...');
  });

  client.on('ready', () => {
    console.log('✅ Redis connection ready');
  });

  client.on('end', () => {
    console.log('🔌 Redis connection ended');
  });

  try {
    // Connect to Redis
    await client.connect();
    console.log('🚀 Successfully connected to Redis!');

    // Test basic operations
    console.log('\n🧪 Testing basic operations...');

    // 1. Ping test
    const pingResult = await client.ping();
    console.log(`🏓 Ping response: ${pingResult}`);

    // 2. Set/get test
    await client.set('redis_test_key', 'Hello from standalone Redis test!');
    const getResult = await client.get('redis_test_key');
    console.log(`📨 Get result: ${getResult}`);

    // 3. Set with expiration
    await client.setEx('temp_key', 60, 'This will expire in 60 seconds');
    console.log('⏰ Set key with expiration (60 seconds)');

    // 4. Check if keys exist
    const keys = await client.keys('*');
    console.log(`🔑 Found ${keys.length} keys:`, keys);

    // 5. Get server info
    const info = await client.info();
    console.log('📊 Redis server info received');

    console.log('\n🎉 All Redis tests passed successfully!');
  } catch (error) {
    console.error('💥 Redis connection failed:', error.message);
    console.error('Error details:', error);

    // Additional troubleshooting tips
    console.log('\n🔍 Troubleshooting tips:');
    console.log('1. Pastikan Redis server sedang running');
    console.log('2. Check host dan port configuration');
    console.log('3. Jika menggunakan Docker, pastikan container running');
    console.log('4. Check firewall settings');
  } finally {
    // Cleanup
    if (client.isOpen) {
      await client.disconnect();
      console.log('\n👋 Redis connection closed');
    }
    process.exit(0);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  testRedisStandalone().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

export { testRedisStandalone };
