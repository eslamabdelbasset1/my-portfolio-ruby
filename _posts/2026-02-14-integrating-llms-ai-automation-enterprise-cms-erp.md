---
layout: post
title: "Integrating LLMs & Vector Search into Enterprise CMS and Newsroom Workflows"
date: 2026-02-14 10:00:00 +0000
categories: [AI, Architecture, Laravel]
tags: [ai, llm, vector-search, enterprise-cms, automation, pgvector]
author: Eslam Abdelbasset
---

In enterprise media and digital newsroom publishing, editorial teams publish hundreds of articles and archive thousands of media assets every week. At **Layout International**, where we build enterprise publishing infrastructure serving high-profile global newsrooms, manually tagging categories, generating SEO descriptions, and searching through historical archives used to consume hundreds of editorial hours each month.

In this article, I will break down how we engineered a resilient, production-grade **LLM Gateway and Vector Search Engine** in **Laravel** and **PostgreSQL (pgvector)**, reducing manual editorial turnaround by 65% while maintaining strict token budget quotas and zero downtime.

---

## 1. Architectural Blueprint: The AI Gateway Pattern

Directly embedding vendor SDK calls (like OpenAI or Anthropic) inside HTTP controllers or standard models introduces massive vendor lock-in, unmanaged rate limits, and latency spikes.

Instead, we designed an **AI Gateway Micro-Layer** within our modular backend:

```text
[Digital Newsroom CMS / Vue.js UI]
        │
        ▼ (Editor requests AI Assistance)
[Laravel AI Gateway Service]
        │
   ┌────┴──────────────────────────┐
   │ Check Cache & Quota           │
   ▼                               ▼
[Redis Embedding / Prompt Cache] [Token Budget Limiter]
   │
   ├─► (Cache Miss) ───────────────┐
   │                               ▼
[Failover Provider Router] ──► [Primary: OpenAI / Claude]
   │                               │
   │ (On 5xx or Rate Limit)        ▼
   └─────────────────────────► [Fallback: Local Self-Hosted Ollama]
                                   │
                                   ▼
                       [pgvector / Semantic Index]
```

---

## 2. Semantic Search Across Millions of News Articles with `pgvector`

Traditional keyword search (e.g. `LIKE '%query%'` or basic full-text search) fails when journalists search for conceptual topics rather than exact words. 

By storing embeddings directly in PostgreSQL using the `pgvector` extension, we can query semantic similarity in milliseconds.

### Database Migration in Laravel

```php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::statement('CREATE EXTENSION IF NOT EXISTS vector;');

        Schema::create('article_embeddings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained()->cascadeOnDelete();
            // 1536 dimensions for text-embedding-3-small
            $table->timestamps();
        });

        // Add vector column via raw SQL
        DB::statement('ALTER TABLE article_embeddings ADD COLUMN embedding vector(1536);');

        // Create an HNSW index for ultra-fast approximate nearest neighbor lookup
        DB::statement('
            CREATE INDEX idx_article_embeddings_hnsw 
            ON article_embeddings 
            USING hnsw (embedding vector_cosine_ops)
            WITH (m = 16, ef_construction = 64);
        ');
    }

    public function down(): void
    {
        Schema::dropIfExists('article_embeddings');
    }
};
```

### Querying Cosine Distance in Laravel

```php
namespace App\Services\Search;

use Illuminate\Support\Facades\DB;
use App\Models\Article;

class SemanticSearchService
{
    public function findSimilarArticles(array $queryVector, int $limit = 5): array
    {
        $vectorString = '[' . implode(',', $queryVector) . ']';

        return DB::table('article_embeddings')
            ->join('articles', 'article_embeddings.article_id', '=', 'articles.id')
            ->select('articles.id', 'articles.title', 'articles.slug')
            ->selectRaw('1 - (embedding <=> ?::vector) AS cosine_similarity', [$vectorString])
            ->whereRaw('1 - (embedding <=> ?::vector) > 0.75', [$vectorString])
            ->orderByRaw('embedding <=> ?::vector ASC', [$vectorString])
            ->limit($limit)
            ->get()
            ->toArray();
    }
}
```

With the **HNSW (Hierarchical Navigable Small World)** index, similarity queries across 500,000 archived articles execute in **under 25 milliseconds**.

---

## 3. Automated Editorial Taxonomy Tagging via Structured Outputs

To ensure the LLM returns valid taxonomy tags that match the CMS database schema, we enforce **Strict JSON Schemas** using the structured output API:

```php
namespace App\Services\AI;

use Illuminate\Support\Facades\Http;

class EditorialClassifier
{
    public function classifyArticle(string $headline, string $bodyText): array
    {
        $response = Http::withToken(config('services.ai.api_key'))
            ->timeout(20)
            ->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-4o-mini',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are an enterprise newsroom taxonomy classifier. Respond strictly with the defined JSON schema.'
                    ],
                    [
                        'role' => 'user',
                        'content' => "Headline: {$headline}\n\nContent:\n{$bodyText}"
                    ]
                ],
                'response_format' => [
                    'type' => 'json_schema',
                    'json_schema' => [
                        'name' => 'editorial_classification',
                        'strict' => true,
                        'schema' => [
                            'type' => 'object',
                            'properties' => [
                                'primary_category' => ['type' => 'string'],
                                'secondary_tags' => [
                                    'type' => 'array',
                                    'items' => ['type' => 'string']
                                ],
                                'suggested_seo_description' => ['type' => 'string'],
                                'reading_time_minutes' => ['type' => 'integer']
                            ],
                            'required' => ['primary_category', 'secondary_tags', 'suggested_seo_description', 'reading_time_minutes'],
                            'additionalProperties' => false
                        ]
                    ]
                ]
            ]);

        return json_decode($response->json('choices.0.message.content'), true);
    }
}
```

---

## 4. Cost Optimization & Resilience: The Semantic Prompt Cache

AI APIs are expensive and have strict rate limits. If two editors run similar categorization queries on syndicated wire news, calling the external model twice burns budget unnecessarily.

We built a **Semantic Prompt Cache** using Redis:
- Compute an MD5/SHA256 signature of the normalized article body.
- If found in Redis, return the cached taxonomy instantly (0 token cost, 2ms latency).
- **Result**: Cut external LLM API costs by **68%** within the first month.

---

## 5. Enterprise Takeaways

1. **Never Block HTTP Requests**: Always trigger embedding generations and complex document summaries through background worker queues (Laravel Horizon).
2. **Provider Redundancy**: Build a fallback mechanism. If your cloud provider experiences a major outage or API rate throttle, your gateway should seamlessly divert non-urgent inference jobs to local self-hosted open models (e.g. Ollama running Llama 3 / Mistral).
3. **Strict Validation**: Always validate structured outputs with standard FormRequests before persisting directly into the relational database.

Integrating AI into enterprise architecture is not about hype; it is about building reliable, fault-tolerant infrastructure that delivers concrete operational velocity to business teams.
