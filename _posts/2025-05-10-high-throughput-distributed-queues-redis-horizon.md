---
layout: post
title: "High-Throughput Distributed Queues & Event Pipelines with Redis and Laravel Horizon"
date: 2025-05-10 10:00:00 +0000
categories: [System Design, Performance, DevOps]
tags: [redis, queues, horizon, laravel, high-throughput, microservices]
author: Eslam Abdelbasset
---

When enterprise applications scale past simple request-response lifecycles, offloading time-consuming tasks to asynchronous workers is no longer optional—it is the bedrock of system stability. At **Loc Camp** and throughout various enterprise client systems I've engineered, our APIs needed to maintain **sub-100ms response latencies** even while dispatching heavy notifications, generating invoices, synchronizing inventory, and streaming WebSockets updates.

In this deep dive, I'll walk through the exact queue topology, worker scaling strategies, concurrency locking patterns, and operational guardrails required to handle **10M+ monthly background tasks** smoothly using **Redis** and **Laravel Horizon**.

---

## 1. The Queue Topology: Anti-Starvation Partitioning

The most common trap in background job architecture is putting every job into a single `default` queue. A sudden burst of 50,000 marketing emails or PDF reports will starve instant SMS alerts, payment webhooks, or live reservation updates for hours.

We partition queues by SLA (Service Level Agreement) and execution profile:

| Queue Name | SLA / Latency Target | Typical Workloads | Concurrency Weight |
| :--- | :--- | :--- | :--- |
| `critical` | `< 1 second` | Payment webhooks, OTP codes, Auth events | High (Dedicated workers) |
| `high` | `< 5 seconds` | Live reservation broadcasting, CRM triggers | Moderate |
| `default` | `< 60 seconds` | Standard database sync, audit logging | Balanced |
| `reports` | `< 15 minutes` | Heavy PDF rendering, Excel export generation | Isolated low-priority pool |
| `webhooks` | `< 5 minutes` | Third-party partner HTTP callbacks | Retries with exponential backoff |

### Horizon Multi-Supervisor Configuration

In `config/horizon.php`, we dedicate worker processes specifically to prevent heavy jobs from blocking real-time operations:

```php
'environments' => [
    'production' => [
        'supervisor-critical' => [
            'connection' => 'redis',
            'queue' => ['critical', 'high'],
            'balance' => 'simple',
            'processes' => 12,
            'tries' => 3,
            'timeout' => 30,
        ],
        'supervisor-default' => [
            'connection' => 'redis',
            'queue' => ['default'],
            'balance' => 'auto',
            'minProcesses' => 5,
            'maxProcesses' => 25,
            'balanceMaxShift' => 3,
            'balanceCooldown' => 3,
            'tries' => 3,
            'timeout' => 90,
        ],
        'supervisor-heavy' => [
            'connection' => 'redis',
            'queue' => ['reports'],
            'balance' => 'simple',
            'processes' => 4,
            'tries' => 2,
            'timeout' => 600, // 10 minutes max
            'memory' => 512,  // 512MB memory limit
        ],
    ],
],
```

---

## 2. Idempotency & Distributed Deduplication

In distributed systems, the rule is **at-least-once delivery**. Transient network timeouts or Redis failovers can cause a worker to re-execute a job that actually succeeded. If that job charges a credit card or increments a balance, the consequences are disastrous.

### Implementing Idempotent Execution with Redis

Every transaction-sensitive job must declare an **Idempotency Key** stored with a TTL in Redis:

```php
namespace App\Jobs;

use App\Services\PaymentService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Redis;

class ProcessPaymentTransactionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $transactionId,
        public float $amount,
        public int $userId
    ) {}

    public function handle(PaymentService $payments): void
    {
        $idempotencyKey = "job:idempotency:payment:{$this->transactionId}";

        // SETNX: Set if Not Exists with a 24-hour expiration
        $acquired = Redis::set($idempotencyKey, 'processing', 'EX', 86400, 'NX');

        if (!$acquired) {
            $status = Redis::get($idempotencyKey);
            if ($status === 'completed') {
                // Already successfully processed; safely ignore duplicate
                return;
            }
            // If still processing by another concurrent worker, release back to queue
            $this->release(10);
            return;
        }

        try {
            $payments->execute($this->transactionId, $this->amount, $this->userId);
            Redis::set($idempotencyKey, 'completed', 'EX', 86400);
        } catch (\Throwable $e) {
            // Delete key so a legitimate retry can attempt again
            Redis::del($idempotencyKey);
            throw $e;
        }
    }
}
```

---

## 3. Atomic Rate Limiting for External APIs

When background jobs integrate with external third-party APIs (like WhatsApp gateways, ZATCA, or Stripe), firing 200 concurrent requests will trigger HTTP 429 (Too Many Requests).

Using Laravel's `Redis::throttle`:

```php
use Illuminate\Support\Facades\Redis;

public function handle(): void
{
    Redis::throttle('whatsapp-api-rate-limit')
        ->block(0)           // Do not block worker thread
        ->allow(30)          // Max 30 requests...
        ->every(60)          // ...per 60 seconds
        ->then(function () {
            // Safe to dispatch API call
            $this->sendExternalNotification();
        }, function () {
            // Could not obtain lock, release back to queue for retry in 15s
            return $this->release(15);
        });
}
```

---

## 4. Redis Memory Management & Production Tuning

Running Redis as a production message broker alongside caching requires strict infrastructure parameters:

1. **Maxmemory Policy**: Use `noeviction` for your queue instance! If Redis runs out of memory under `allkeys-lru`, it will evict queued jobs randomly, permanently losing customer events.
   ```ini
   maxmemory 4gb
   maxmemory-policy noeviction
   ```
2. **Dedicated Redis Instances**: Never share the same Redis instance for application caching (`Cache::put`) and queue workers. A heavy cache key invalidation or cache flush (`redis-cli FLUSHDB`) will destroy your queue pipeline.
3. **AOF Persistence**: Configure `appendonly yes` with `appendfsync everysec` on your queue broker to ensure zero job loss even in the event of hardware power failure.

---

## 5. Metrics & Production Impact

By implementing this architecture across our multi-tenant platforms:
- **P99 API Latency**: Dropped from **620ms down to 68ms** by offloading all sync calls to partitioned workers.
- **Throughput**: Scaled seamlessly past **12,000 jobs per minute** during peak flash campaigns without worker pool starvation.
- **Failure Visibility**: Automated Slack and Sentry triggers on failed jobs within Horizon provided zero-downtime error recovery.

Distributed queues are not just an optimization tool; when engineered thoughtfully, they are the backbone that keeps enterprise systems resilient under extreme pressure.
