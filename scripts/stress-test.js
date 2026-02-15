const autocannon = require('autocannon');

async function runTest() {
    console.log('--- STARTING LOCAL STRESS TEST (Localhost:3000) ---');
    console.log('Users: 100, Duration: 10s');

    const result = await autocannon({
        url: 'http://localhost:3000/hotels',
        connections: 100, // Concurrent users
        duration: 10,     // 10 seconds
        pipelining: 1,
    });

    console.log('--- TEST COMPLETED ---');
    console.log(`Total Requests: ${result.requests.total}`);
    console.log(`Average Latency: ${result.latency.average} ms`);
    console.log(`Requests/sec: ${result.requests.average}`);
    console.log(`Errors: ${result.errors}`);

    if (result.errors > 0) {
        console.error('ALARM: Errors detected during test!');
    } else {
        console.log('SUCCESS: System handled 100 users flawlessly.');
    }
}

runTest();
