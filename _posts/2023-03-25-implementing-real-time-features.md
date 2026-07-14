---
layout: post
title: "Implementing Real-Time Features with Laravel Echo and WebSockets"
date: 2023-03-25 10:00:00 +0000
categories: [Backend, Real-Time, Laravel]
tags: [websockets, laravel echo, pusher, notifications]
author: Eslam Abdelbasset
---

In today's fast-paced digital ecosystem, users expect instant feedback. Whether it's a live chat, real-time inventory updates, or driver tracking in logistics, the days of polling the server every five seconds are over. 

During my work on delivery and logistics platforms like **AliBash** and complex ERP systems, integrating real-time communication was essential. Here is how we approached building scalable, real-time architectures using Laravel.

## 1. Moving Away from Polling

Polling the server via AJAX creates unnecessary load and latency. By moving to an event-driven architecture using WebSockets, we establish a persistent connection between the client and the server, pushing updates only when data actually changes.

## 2. Setting Up the Broadcasting Event

Laravel makes real-time broadcasting incredibly elegant. By implementing the `ShouldBroadcast` interface on our events, we can push data directly to a configured WebSocket server. 

Here is an example of an event that broadcasts a driver's location to a customer:

```php
<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Order;

class DriverLocationUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $orderId;
    public $lat;
    public $lng;

    public function __construct(Order $order, $lat, $lng)
    {
        $this->orderId = $order->id;
        $this->lat = $lat;
        $this->lng = $lng;
    }

    // Determine the channel the event should broadcast on
    public function broadcastOn()
    {
        // Using a Private channel for security
        return new PrivateChannel('order.' . $this->orderId);
    }
    
    // Customize the data being sent
    public function broadcastWith()
    {
        return [
            'latitude' => $this->lat,
            'longitude' => $this->lng,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
```

## 3. Securing Private Channels

Real-time data is often sensitive. We implemented strict authorization rules on our private and presence channels. For instance, ensuring that only the assigned driver and the specific customer can subscribe to a delivery tracking channel prevents unauthorized access to location data.

In `routes/channels.php`:

```php
<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Order;

Broadcast::channel('order.{orderId}', function ($user, $orderId) {
    $order = Order::find($orderId);
    
    // Only the customer who made the order or the assigned driver can listen
    return $user->id === $order->customer_id || $user->id === $order->driver_id;
});
```

## 4. Connecting the Frontend with Laravel Echo

To listen to these events on the frontend (e.g., using Vue.js or raw JavaScript), we utilize **Laravel Echo**.

```javascript
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'pusher',
    key: process.env.MIX_PUSHER_APP_KEY,
    cluster: process.env.MIX_PUSHER_APP_CLUSTER,
    forceTLS: true
});

// Listening to the private channel
const orderId = 12345;

window.Echo.private(`order.${orderId}`)
    .listen('DriverLocationUpdated', (e) => {
        console.log("Driver is now at:", e.latitude, e.longitude);
        // Update the Google Maps marker in your UI here...
        updateMarker(e.latitude, e.longitude);
    });
```

## 5. Choosing the Right WebSocket Server

While third-party services like Pusher are great for getting started, enterprise scale often demands self-hosted solutions to control costs and ensure data privacy. Utilizing packages like `laravel-websockets` or the native **Laravel Reverb** (introduced in Laravel 11) allows you to run your own WebSocket server directly on your infrastructure, saving thousands of dollars at scale.

Real-time capabilities fundamentally transform the user experience from passive to interactive, driving engagement and operational efficiency.
