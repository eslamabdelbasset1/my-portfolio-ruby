---
layout: post
title: "Architecting ZATCA Phase 2 E-Invoicing in Saudi Arabia with Laravel & PHP 8+"
date: 2025-01-18 10:00:00 +0000
categories: [FinTech, Laravel, Architecture]
tags: [zatca, e-invoicing, laravel, cryptography, saudi-arabia, enterprise]
author: Eslam Abdelbasset
---

Integrating with the **Zakat, Tax and Customs Authority (ZATCA)** Phase 2 (the *Integration Phase*) in the Kingdom of Saudi Arabia is one of the most rigorous compliance and technical hurdles in enterprise software. Unlike Phase 1, which primarily mandated offline QR codes and tamper-proof storage, Phase 2 demands **machine-to-machine (M2M) cryptographic validation**, strict **UBL 2.1 XML** formatting, automated clearance/reporting APIs, and digital certificate management.

During my architectural consulting and lead development work for SaaS ERP systems in Saudi Arabia (including **Tog.sa** and **Manarat El Asr**), I designed an automated, resilient pipeline capable of signing, validating, and submitting tens of thousands of invoices daily with zero human intervention.

In this post, I will break down the end-to-end architecture, the cryptography requirements, and production-tested Laravel implementation patterns.

---

## 1. High-Level Architectural Flow

ZATCA Phase 2 splits invoices into two distinct operational flows:

1. **Standard Tax Invoices (B2B)**: Require **Clearance**. The invoice XML must be sent to the ZATCA Clearance API in real-time. Only once ZATCA cryptographically clears and returns the approved XML can the buyer legally receive it.
2. **Simplified Tax Invoices (B2C)**: Require **Reporting**. Invoices are issued to consumers immediately (with the cryptographic QR code printed on receipt), and must be reported to ZATCA within 24 hours via the Reporting API.

```text
[ERP / POS System]
        │
        ▼ (Generate Invoice Data)
[UBL 2.1 XML Builder]
        │
        ▼ (Canonicalize XML via C14N)
[SHA-256 Invoice Hash]
        │
        ▼ (ECDSA secp256k1 Signing with Private Key)
[Digital Signature & X.509 Certificate Injection]
        │
        ▼ (Compute Base64 TLV QR Code)
[Final Signed Invoice XML]
        │
   ┌────┴────────────────────────┐
   │ B2B (Real-Time Clearance)   │ B2C (Async Queue Reporting)
   ▼                             ▼
[ZATCA Clearance API]         [Redis Queue / Horizon Worker]
   │                             │
   │ (Returned Cleared XML)      ▼
   ▼                          [ZATCA Reporting API]
[Client Delivery & Archive]
```

---

## 2. Onboarding & Cryptographic Identity (CSID)

Before an Enterprise Solution (EGS) can communicate with ZATCA, it must be onboarded using an **ECDSA key pair** on the `secp256k1` elliptic curve.

### Generating Keys & CSR in PHP

We generate an EC private key and create a Certificate Signing Request (CSR) with specific custom OIDs mandated by ZATCA:

```php
namespace App\Services\Zatca;

class ZatcaKeyService
{
    public function generateKeyPair(): array
    {
        $config = [
            'curve_name' => 'secp256k1',
            'private_key_type' => OPENSSL_KEYTYPE_EC,
        ];

        $res = openssl_pkey_new($config);
        openssl_pkey_export($res, $privateKey);

        $details = openssl_pkey_get_details($res);
        $publicKey = $details['key'];

        return [
            'private_key' => $privateKey,
            'public_key'  => $publicKey,
        ];
    }
}
```

Once onboarded via OTP using the Compliance API, ZATCA grants a **Compliance CSID**, which is upgraded to a **Production CSID** after passing simulated checks for credit notes, debit notes, and standard invoices.

---

## 3. UBL 2.1 XML Construction & Hashing

ZATCA enforces strict conformance to the Universal Business Language (UBL 2.1) syntax. Missing even a single mandatory element or decimal precision rounding mistake will cause instant schema rejection.

### The Canonicalization & Hashing Process

To sign an invoice, we must compute an invoice digest:
1. Extract invoice elements excluding `<ext:UBLExtensions>`, `<cac:Signature>`, and `<cac:AdditionalDocumentReference>` for QR code.
2. Canonicalize the XML string using standard C14N 1.1 formatting.
3. Compute the `SHA-256` hash and Base64 encode it.

```php
namespace App\Services\Zatca;

use DOMDocument;

class InvoiceHasher
{
    public function computeInvoiceHash(string $rawXml): string
    {
        $dom = new DOMDocument('1.0', 'UTF-8');
        $dom->preserveWhiteSpace = false;
        $dom->formatOutput = false;
        $dom->loadXML($rawXml);

        // Remove signature & extension blocks prior to digest
        $this->stripSignatureElements($dom);

        // Canonicalize using C14N
        $canonicalXml = $dom->C14N(false, false);

        // SHA-256 binary hash -> base64
        return base64_encode(hash('sha256', $canonicalXml, true));
    }

    private function stripSignatureElements(DOMDocument $dom): void
    {
        $xpath = new \DOMXPath($dom);
        $xpath->registerNamespace('ext', 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2');
        $xpath->registerNamespace('cac', 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2');

        $nodes = $xpath->query('//ext:UBLExtensions | //cac:Signature');
        foreach ($nodes as $node) {
            $node->parentNode->removeChild($node);
        }
    }
}
```

---

## 4. Digital Signature & Base64 TLV QR Code

### Tag-Length-Value (TLV) QR Code

ZATCA simplified invoices require a QR code encoding at least 9 specific TLV tags:
1. Seller's Name
2. VAT Registration Number
3. Invoice Timestamp (ISO 8601)
4. Invoice Total (with VAT)
5. VAT Amount Total
6. Invoice Cryptographic Hash
7. ECDSA Digital Signature
8. Public Key (or Certificate)
9. Cryptographic Stamp Signature Identifier

```php
namespace App\Services\Zatca;

class ZatcaTlvBuilder
{
    public function buildTlvPayload(array $tags): string
    {
        $tlv = '';

        foreach ($tags as $tagNumber => $value) {
            $valStr = (string)$value;
            $length = strlen($valStr);

            // 1 byte tag number + 1 byte length + raw bytes
            $tlv .= chr($tagNumber) . chr($length) . $valStr;
        }

        return base64_encode($tlv);
    }
}
```

---

## 5. High-Throughput Asynchronous Queue Execution

In enterprise ERP environments processing point-of-sale registers across multi-branch retailers (such as Tog.sa clients), synchronous external HTTP calls to ZATCA can create crippling latency bottlenecks.

We separate the **signing and generation** from the **API transmission** using **Laravel Horizon and Redis**:

```php
namespace App\Jobs;

use App\Models\Invoice;
use App\Services\Zatca\ZatcaApiClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SubmitZatcaInvoiceJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;
    public int $backoff = 30;

    public function __construct(public Invoice $invoice) {}

    public function handle(ZatcaApiClient $client): void
    {
        if ($this->invoice->is_b2b) {
            // Synchronous Clearance flow
            $response = $client->clearInvoice($this->invoice->signed_xml);
            $this->invoice->update([
                'zatca_status' => $response['status'],
                'zatca_hash'   => $response['cleared_hash'],
                'cleared_at'   => now(),
            ]);
        } else {
            // Asynchronous Reporting flow
            $response = $client->reportInvoice($this->invoice->signed_xml);
            $this->invoice->update([
                'zatca_status' => $response['status'],
                'reported_at'  => now(),
            ]);
        }
    }
}
```

### Preventing Out-of-Sequence Rejections: Previous Invoice Hash (PIH)

ZATCA enforces **invoice chaining**. Every invoice must reference the hash of the immediately preceding invoice (`PIH`). For the first invoice in a chain, the PIH is 32 bytes of zeros base64-encoded.

In high-concurrency environments, two concurrent transactions could generate identical or conflicting chains. We solved this with **Redis atomic locks**:

```php
use Illuminate\Support\Facades\Cache;

$lock = Cache::lock("tenant:{$tenantId}:zatca_chain_lock", 10);

$lock->block(5, function () use ($invoice) {
    $lastInvoice = Invoice::where('tenant_id', $invoice->tenant_id)
        ->latest('id')
        ->first();

    $invoice->pih = $lastInvoice ? $lastInvoice->invoice_hash : config('zatca.initial_pih');
    $invoice->save();

    // Now sign and generate the chain hash
});
```

---

## 6. Key Enterprise Takeaways

1. **Security & Cryptographic Vaults**: Never store unencrypted raw private keys in plain database columns. Use environment-managed KMS or AWS Secrets Manager with automatic tenant scoping.
2. **Idempotency**: Always send a unique UUID `InvoiceUUID` header to ZATCA so retries do not generate duplicate invoice rejections.
3. **Graceful Degradation**: If ZATCA's API returns a 5xx gateway error during B2C reporting, the system must buffer submissions in exponential backoff queues without stalling consumer checkouts.

Architecting this standard in production transformed our systems into bulletproof enterprise billing engines, fully compliant with Saudi Arabia's digital transformation agenda.
