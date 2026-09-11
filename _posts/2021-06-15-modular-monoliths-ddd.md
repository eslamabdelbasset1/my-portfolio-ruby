---
layout: post
title: "Transitioning to Modular Monoliths with Domain-Driven Design"
date: 2021-06-15 09:30:00 +0000
categories: [Architecture, System Design]
tags: [ddd, modular monolith, architecture, laravel, php]
author: Eslam Abdelbasset
---

The software industry loves buzzwords, and "Microservices" is arguably the biggest one. While microservices solve scaling issues for tech giants, they often introduce unnecessary complexity, network latency, and data consistency nightmares for growing startups.

During my work scaling platforms at **Const Tech** and **Tog.sa**, we found that jumping straight into microservices was often a mistake. Instead, adopting a **Modular Monolith** architecture guided by **Domain-Driven Design (DDD)** offered the best of both worlds.

## 1. What is a Modular Monolith?

A modular monolith is a single deployable application (a monolith) that is strictly divided into independent, decoupled modules (domains) internally. For example, the `Billing` module cannot directly access the database tables of the `Inventory` module.

In a standard Laravel app, code is grouped by technical concern (`Controllers`, `Models`, `Views`). In a modular monolith, we group code by **Business Domain**:

```text
app/
├── Domains/
│   ├── Billing/
│   │   ├── Controllers/
│   │   ├── Models/
│   │   ├── Events/
│   │   └── Providers/
│   ├── Inventory/
│   │   ├── Controllers/
│   │   ├── Models/
│   │   ├── Listeners/
│   │   └── Providers/
```

## 2. Setting Up Domain Service Providers

Each domain should be self-contained and registered via its own Service Provider.

```php
<?php

namespace App\Domains\Billing\Providers;

use Illuminate\Support\ServiceProvider;

class BillingServiceProvider extends ServiceProvider
{
    public function boot()
    {
        // Load domain-specific routes
        $this->loadRoutesFrom(__DIR__ . '/../Routes/api.php');

        // Load domain-specific migrations
        $this->loadMigrationsFrom(__DIR__ . '/../Database/Migrations');
    }
}
```

## 3. Communication via Interfaces and Events

To enforce decoupling, modules are not allowed to call each other's classes directly. 

Instead of `Billing` calling `Inventory::decrement()`, `Billing` fires a Domain Event, and `Inventory` listens to it.

**Firing the Event (Billing Domain):**
```php
<?php

namespace App\Domains\Billing\Services;

use App\Domains\Billing\Events\InvoicePaid;

class InvoiceService
{
    public function payInvoice($invoiceId)
    {
        $invoice = Invoice::findOrFail($invoiceId);
        $invoice->markAsPaid();

        // Broadcast that an invoice was paid. 
        // We do not care who listens.
        event(new InvoicePaid($invoice));
    }
}
```

**Listening to the Event (Inventory Domain):**
```php
<?php

namespace App\Domains\Inventory\Listeners;

use App\Domains\Billing\Events\InvoicePaid;
use App\Domains\Inventory\Services\StockService;

class DeductStockOnPayment
{
    protected $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    public function handle(InvoicePaid $event)
    {
        // The Inventory domain reacts to the Billing domain's event
        foreach ($event->invoice->items as $item) {
            $this->stockService->decrement($item->product_id, $item->quantity);
        }
    }
}
```

## 4. Preparing for the Future

The beauty of the modular monolith is that it prepares you for microservices if you ever truly need them. Because the domains are already strictly decoupled and communicate via events, extracting the `Billing` module into its own standalone microservice later becomes a straightforward refactoring task rather than a massive system rewrite.

By focusing on internal modularity, we achieved high maintainability, fast development cycles, and robust system architecture without the operational overhead of managing distributed systems.
