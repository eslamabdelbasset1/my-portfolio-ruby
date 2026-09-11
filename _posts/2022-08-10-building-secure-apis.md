---
layout: post
title: "Building Secure and Scalable APIs"
date: 2022-08-10 09:15:00 +0000
categories: [API Design, Security]
tags: [api, security, rest, authentication, laravel]
author: Eslam Abdelbasset
---

In modern web development, APIs are the glue that holds disparate systems, mobile applications, and third-party integrations together. Over the years, working across various platforms from **Alshamel Holding** to **Loc Camp**, I've learned that a poorly designed API is not just a performance bottleneck—it's a massive security risk.

Here are the foundational principles and actual code implementations I follow when designing secure and scalable APIs using Laravel.

## 1. Robust Authentication (Laravel Sanctum)

Never rely on basic authentication for public-facing APIs. Implementing **Sanctum** provides secure token-based authentication.

```php
<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return $this->errorResponse('Unauthorized', 401);
        }

        // Issue a secure API token
        $token = $user->createToken('mobile-app')->plainTextToken;

        return $this->successResponse(['token' => $token]);
    }
}
```

## 2. Strict Rate Limiting

APIs must protect themselves from abuse, whether from malicious DDoS attacks or just a poorly written client script stuck in an infinite loop. 

In Laravel 11, configure rate limiting inside `App\Providers\AppServiceProvider`:

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

public function boot()
{
    RateLimiter::for('api', function (Request $request) {
        // Limit to 60 requests per minute per IP or User ID
        return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
    });
}
```
Apply this to your routes:
```php
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::get('/orders', [OrderController::class, 'index']);
});
```

## 3. Data Validation (Form Requests)

"Never trust user input" is the golden rule. Every API endpoint must have strict validation rules using Form Requests.

```php
<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize()
    {
        // Check if the user is allowed to make orders
        return $this->user()->can('create-order');
    }

    public function rules()
    {
        return [
            'product_id' => ['required', 'exists:products,id'],
            'quantity'   => ['required', 'integer', 'min:1', 'max:100'],
            'notes'      => ['nullable', 'string', 'max:500'],
        ];
    }
}
```

## 4. Standardized Error Handling via Traits

Clients need predictable responses. Whether an API call succeeds or fails, the structure of the JSON response should be consistent. We use a base trait for all API controllers:

```php
<?php

namespace App\Traits;

trait ApiResponser
{
    protected function successResponse($data, $message = null, $code = 200)
    {
        return response()->json([
            'status' => 'Success',
            'message' => $message,
            'data' => $data
        ], $code);
    }

    protected function errorResponse($message, $code)
    {
        return response()->json([
            'status' => 'Error',
            'message' => $message,
            'data' => null
        ], $code);
    }
}
```

By enforcing these practices across all your endpoints, you guarantee that mobile developers, frontend teams, and third-party consumers have a reliable, fast, and secure interface to work with.
