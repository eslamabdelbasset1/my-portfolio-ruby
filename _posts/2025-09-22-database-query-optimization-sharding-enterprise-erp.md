---
layout: post
title: "Enterprise Database Tuning: How We Reduced P99 Latencies by 60% on High-Volume ERP Systems"
date: 2025-09-22 10:00:00 +0000
categories: [Database, Performance, Architecture]
tags: [mysql, postgresql, database-optimization, indexing, erp, laravel]
author: Eslam Abdelbasset
---

In enterprise ERP systems, the database is always the ultimate battleground for performance. When an enterprise platform grows past millions of general ledger entries, multi-warehouse inventory movements, and real-time point-of-sale logs, a query that took 12ms during launch can easily balloon to 14 seconds in production, saturating CPU cores and causing cascade transaction timeouts.

During my engineering work at **Const Tech** and **Alshamel Holding**, I was brought in to diagnose, refactor, and scale database architectures experiencing extreme load.

In this post, I will share the exact systematic methodology we used to cut **P99 query response times by 60%**, eliminate deadlocks, and unlock massive throughput on high-volume MySQL and PostgreSQL databases.

---

## 1. Step One: Auditing with Slow Query Logs & EXPLAIN ANALYZE

Never optimize in the dark. Before modifying a single query or index, we enable the **MySQL Slow Query Log** and configure `long_query_time = 0.5`:

```ini
# /etc/mysql/mysql.conf.d/mysqld.cnf
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 0.5
log_queries_not_using_indexes = 1
min_examined_row_limit = 1000
```

When analyzing a problematic ERP query with `EXPLAIN ANALYZE`, look out for three catastrophic red flags:
1. `type: ALL`: A full table scan across millions of rows.
2. `Using filesort`: MySQL is sorting rows in memory buffers or swapping to disk rather than reading ordered index structures.
3. `Using temporary`: Writing intermediate result tables to disk to resolve `GROUP BY` or `DISTINCT`.

---

## 2. Crafting High-Selectivity Composite Indexes

The most common misunderstanding about relational databases is creating single-column indexes on every field in a `WHERE` clause. 

Consider this standard ERP transaction lookup:
```sql
SELECT id, transaction_date, total_amount, status 
FROM financial_transactions 
WHERE company_id = 42 
  AND status = 'posted' 
  AND transaction_date BETWEEN '2025-01-01' AND '2025-03-31'
ORDER BY transaction_date DESC;
```

Having separate indexes on `company_id`, `status`, and `transaction_date` forces the query engine into an inefficient index merge.

### The ESR Rule (Equality, Sort, Range)

To construct an optimal composite index, follow the **ESR Rule**:
1. **Equality (`=`) Columns First**: `company_id`, `status`
2. **Sort (`ORDER BY`) Columns Second**: `transaction_date`
3. **Range (`BETWEEN`, `>`, `<`) Columns Last**: `transaction_date`

```sql
ALTER TABLE financial_transactions 
ADD INDEX idx_company_status_date (company_id, status, transaction_date DESC);
```

### Creating a Covering Index

If the `SELECT` query only asks for columns already present in the index leaf nodes, the database engine **never touches the actual table disk blocks** (a Covering Index lookup):

```sql
ALTER TABLE financial_transactions 
ADD INDEX idx_covering_financials (company_id, status, transaction_date DESC, total_amount, id);
```

In our production audit, turning standard scans into covering index queries dropped execution time from **2,450ms down to 14ms** for multi-tenant balance sheets.

---

## 3. Eliminating Eloquent ORM Hidden Traps

Laravel's Eloquent ORM is elegant, but standard developer habits frequently introduce severe database performance hits:

### Problem: Blind `withCount` & Subquery Bloat

```php
// Inefficient: Generates an inline scalar SELECT count(*) for every single row
$accounts = Account::where('company_id', $companyId)
    ->withCount('transactions')
    ->get();
```

When displaying 50 accounts on an executive dashboard, this fires 50 nested sub-aggregations.

### Solution: Single Aggregate Join

```php
$accounts = Account::where('accounts.company_id', $companyId)
    ->leftJoin('financial_transactions', 'accounts.id', '=', 'financial_transactions.account_id')
    ->select('accounts.id', 'accounts.name', DB::raw('COUNT(financial_transactions.id) as total_tx_count'))
    ->groupBy('accounts.id', 'accounts.name')
    ->get();
```

---

## 4. Zero-Downtime Table Partitioning

When our `audit_logs` and `stock_ledger_entries` exceeded **25 million rows**, maintenance tasks (like vacuuming, reindexing, or querying recent months) began degrading overall IOPS.

We implemented **Range Partitioning by Month/Year**:

```sql
ALTER TABLE stock_ledger_entries 
PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at)) (
    PARTITION p_2024_q4 VALUES LESS THAN (202501),
    PARTITION p_2025_01 VALUES LESS THAN (202502),
    PARTITION p_2025_02 VALUES LESS THAN (202503),
    PARTITION p_2025_03 VALUES LESS THAN (202504),
    PARTITION p_future  VALUES LESS THAN MAXVALUE
);
```

### Why Partitioning Rescued P99:
- **Partition Pruning**: A query for `WHERE created_at >= '2025-02-01'` immediately ignores 90% of the physical files on disk, scanning only partition `p_2025_02`.
- **Instant Archiving**: Dropping historical records past statutory limits takes milliseconds via `ALTER TABLE ... DROP PARTITION` instead of running millions of row-by-row `DELETE` statements that lock tables and fragment disk pages.

---

## 5. Materialized Aggregates with Redis Caching

For heavy financial summaries (Daily Profit & Loss, Trial Balance, Inventory Valuation), computing aggregates on the fly across 100k transactions per request is wasteful.

We created an **Event-Driven Materialized Cache** using Redis Hashes:

```php
namespace App\Observers;

use App\Models\FinancialTransaction;
use Illuminate\Support\Facades\Redis;

class FinancialTransactionObserver
{
    public function created(FinancialTransaction $tx): void
    {
        $dateKey = $tx->transaction_date->format('Y-m-d');
        $hashKey = "tenant:{$tx->company_id}:pnl:{$dateKey}";

        Redis::hIncrByFloat($hashKey, 'total_revenue', $tx->credit_amount);
        Redis::hIncrByFloat($hashKey, 'total_expense', $tx->debit_amount);
        Redis::expire($hashKey, 86400 * 30); // 30-day retention
    }
}
```

Now, the executive P&L dashboard fetches pre-aggregated numbers from Redis in **under 3 milliseconds**, eliminating 95% of heavy analytic database queries.

---

## 6. Summary of Architectural Results

| Metric | Before Optimization | After Optimization | Improvement |
| :--- | :--- | :--- | :--- |
| **P99 API Latency** | 1,840ms | 110ms | **94% Reduction** |
| **Financial Report Generation** | 18.4s | 0.8s | **95% Faster** |
| **Database Server CPU Usage** | 85% avg (spikes to 100%) | 28% avg | **67% Reduction** |
| **Deadlock Occurrences** | ~15 / day | 0 in 6 months | **100% Eliminated** |

High-performance database engineering is not about blindly scaling hardware; it is about respecting how database storage engines interact with disk, memory, and indexes.
