# Load Testing Strategy (10,000 Concurrent Users)

To ensure the COP17 platform handles 10,000 simultaneous users, we must simulate real traffic patterns and identify where the system breaks.

## 1. Recommended Tool: k6
[k6](https://k6.io/) is an open-source tool by Grafana that allows you to write performance tests in JavaScript. It is perfect for our Next.js + Supabase stack.

## 2. Infrastructure Bottlenecks
With 10,000 users, the most common failure points are:
- **Supabase (Database)**: Postgres has a limit on the number of open connections. We MUST use **PgBouncer** (Supabase Connection Pooling) to handle high concurrency.
- **Vercel (Compute)**: Serverless functions scale automatically, but have a maximum number of concurrent executions per region.
- **API Keys**: Ensure Google Maps API is not restricted by daily quotas during the test.

## 3. Sample Test Script
Create a file named `load-test.js`:

```javascript
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 1000 }, // Ramp up to 1000 users
    { duration: '5m', target: 5000 }, // Stay at 5000 users
    { duration: '2m', target: 10000 }, // Peak at 10,000 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
};

export default function () {
  // Simulate user browsing the hotels page
  const res = http.get('https://cop17.vercel.app/hotels');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'load time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1); // Think time: user waits 1 second before next action
}
```

## 4. Execution Plan
1. **Local Run (Small Scale)**: Run `k6 run load-test.js` from your machine to test with 50-100 users.
2. **Cloud Run (Large Scale)**: Generating 10k users from one laptop is impossible. You need a distributed service like **k6 Cloud** or **AWS Fargate** to launch agents globally.
3. **Monitoring**: Watch the **Supabase Dashboard** (Database load) and **Vercel Logs** (Function errors) during the test.
