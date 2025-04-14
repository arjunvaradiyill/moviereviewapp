const dns = require('dns');

console.log('Checking DNS resolution for MongoDB Atlas...');

// Try to resolve the SRV record
dns.resolveSrv('_mongodb._tcp.moviereview.dacg6.mongodb.net', (err, addresses) => {
  if (err) {
    console.error('Error resolving SRV record:', err);
    console.log('\nTrying direct hostname resolution...');
    
    // Try to resolve the hostnames directly
    const hosts = [
      'moviereview-shard-00-00.dacg6.mongodb.net',
      'moviereview-shard-00-01.dacg6.mongodb.net',
      'moviereview-shard-00-02.dacg6.mongodb.net'
    ];
    
    let resolvedCount = 0;
    
    hosts.forEach(host => {
      dns.resolve4(host, (err, addresses) => {
        if (err) {
          console.error(`Error resolving ${host}:`, err);
        } else {
          console.log(`Successfully resolved ${host} to:`, addresses);
          resolvedCount++;
        }
        
        if (resolvedCount === hosts.length) {
          console.log('\nAll shard hostnames resolved successfully.');
          console.log('\nYou can use the direct connection string:');
          console.log('mongodb://arjunvaradiyil203:c21fGh5SYEvPt1Ww@moviereview-shard-00-00.dacg6.mongodb.net:27017,moviereview-shard-00-01.dacg6.mongodb.net:27017,moviereview-shard-00-02.dacg6.mongodb.net:27017/moviedb?ssl=true&replicaSet=atlas-1qbckj-shard-0&authSource=admin&retryWrites=true&w=majority');
        } else if (resolvedCount + (hosts.length - resolvedCount) === hosts.length && resolvedCount === 0) {
          console.log('\nCould not resolve any hostnames. This indicates DNS or network connectivity issues.');
          console.log('Please check your internet connection and firewall settings.');
        }
      });
    });
  } else {
    console.log('Successfully resolved SRV record:', addresses);
    console.log('\nYour DNS is working correctly for MongoDB Atlas SRV records.');
    console.log('You can use the SRV connection string:');
    console.log('mongodb+srv://arjunvaradiyil203:c21fGh5SYEvPt1Ww@moviereview.dacg6.mongodb.net/moviedb?retryWrites=true&w=majority');
  }
});

// Try to resolve the hostname part
dns.resolve4('moviereview.dacg6.mongodb.net', (err, addresses) => {
  if (err) {
    console.error('\nError resolving cluster hostname:', err);
  } else {
    console.log('\nCluster hostname resolves to:', addresses);
  }
}); 