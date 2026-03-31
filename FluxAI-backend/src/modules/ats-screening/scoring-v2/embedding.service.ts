/**
 * ATS Scoring Engine V2 — Embedding Service
 *
 * Centralised wrapper around OpenAI embeddings with:
 * - In-memory LRU cache to avoid redundant API calls
 * - Batch API support (up to 2048 inputs per call)
 * - Cosine similarity utility
 *
 * Uses text-embedding-3-small (1536 dimensions) for cost efficiency.
 * At ~$0.02/1M tokens, 10k candidates × 200 tokens = ~$0.04 per job run.
 */

import OpenAI from 'openai';

// ──────────────────────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────────────────────

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

/** Maximum inputs per OpenAI embedding batch call */
const MAX_BATCH_SIZE = 2048;

/** LRU cache: max entries before eviction */
const CACHE_MAX_SIZE = 10_000;

/** Cache TTL in milliseconds (1 hour) */
const CACHE_TTL_MS = 60 * 60 * 1000;

// ──────────────────────────────────────────────────────────────
// LRU Cache Entry
// ──────────────────────────────────────────────────────────────

interface CacheEntry {
    embedding: number[];
    timestamp: number;
}

// ──────────────────────────────────────────────────────────────
// Embedding Service (Singleton)
// ──────────────────────────────────────────────────────────────

class EmbeddingServiceImpl {
    private client: OpenAI;
    private cache: Map<string, CacheEntry> = new Map();

    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    // ────────────────────────────────────────────────────────
    // Public API
    // ────────────────────────────────────────────────────────

    /**
     * Embed a single text string. Returns cached result if available.
     */
    async embed(text: string): Promise<number[]> {
        const cacheKey = this.toCacheKey(text);
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        const result = await this.callApi([text]);
        const embedding = result[0];
        this.setCache(cacheKey, embedding);
        return embedding;
    }

    /**
     * Embed multiple texts in a single API call (up to MAX_BATCH_SIZE).
     * Returns embeddings in the same order as inputs.
     * Leverages cache: only texts without cache hits are sent to the API.
     */
    async embedBatch(texts: string[]): Promise<number[][]> {
        if (texts.length === 0) return [];

        const results: (number[] | null)[] = new Array(texts.length).fill(null);
        const uncachedIndices: number[] = [];
        const uncachedTexts: string[] = [];

        // Check cache first
        for (let i = 0; i < texts.length; i++) {
            const cacheKey = this.toCacheKey(texts[i]);
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                results[i] = cached;
            } else {
                uncachedIndices.push(i);
                uncachedTexts.push(texts[i]);
            }
        }

        // Batch-call API for misses
        if (uncachedTexts.length > 0) {
            const embeddings = await this.callApiBatched(uncachedTexts);
            for (let j = 0; j < uncachedIndices.length; j++) {
                const idx = uncachedIndices[j];
                results[idx] = embeddings[j];
                this.setCache(this.toCacheKey(texts[idx]), embeddings[j]);
            }
        }

        return results as number[][];
    }

    /**
     * Cosine similarity between two vectors (both must be same dimension).
     * Returns a value in [-1, 1]; higher = more similar.
     */
    cosine(a: number[], b: number[]): number {
        if (a.length !== b.length) {
            throw new Error(`Embedding dimension mismatch: ${a.length} vs ${b.length}`);
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        if (denominator === 0) return 0;

        return dotProduct / denominator;
    }

    /**
     * Convenience: embed two texts and return their cosine similarity.
     */
    async similarity(textA: string, textB: string): Promise<number> {
        const [embA, embB] = await this.embedBatch([textA, textB]);
        return this.cosine(embA, embB);
    }

    /**
     * Clear the entire embedding cache.
     * Useful for testing or when switching API keys.
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Returns current cache size (for monitoring).
     */
    get cacheSize(): number {
        return this.cache.size;
    }

    // ────────────────────────────────────────────────────────
    // Internal: API Calls
    // ────────────────────────────────────────────────────────

    private async callApi(inputs: string[]): Promise<number[][]> {
        const response = await this.client.embeddings.create({
            model: EMBEDDING_MODEL,
            input: inputs,
            dimensions: EMBEDDING_DIMENSIONS,
        });

        // API returns objects with { index, embedding }; sort by index for safety
        const sorted = response.data.sort((a, b) => a.index - b.index);
        return sorted.map(d => d.embedding);
    }

    /**
     * Handles inputs larger than MAX_BATCH_SIZE by chunking.
     */
    private async callApiBatched(inputs: string[]): Promise<number[][]> {
        if (inputs.length <= MAX_BATCH_SIZE) {
            return this.callApi(inputs);
        }

        const allResults: number[][] = [];
        for (let i = 0; i < inputs.length; i += MAX_BATCH_SIZE) {
            const chunk = inputs.slice(i, i + MAX_BATCH_SIZE);
            const chunkResults = await this.callApi(chunk);
            allResults.push(...chunkResults);
        }
        return allResults;
    }

    // ────────────────────────────────────────────────────────
    // Internal: Cache Management (LRU with TTL)
    // ────────────────────────────────────────────────────────

    private toCacheKey(text: string): string {
        return text.trim().toLowerCase();
    }

    private getFromCache(key: string): number[] | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        // TTL check
        if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
            this.cache.delete(key);
            return null;
        }

        // Move to end for LRU (delete + re-insert)
        this.cache.delete(key);
        this.cache.set(key, entry);
        return entry.embedding;
    }

    private setCache(key: string, embedding: number[]): void {
        // Evict oldest if at capacity
        if (this.cache.size >= CACHE_MAX_SIZE) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey !== undefined) {
                this.cache.delete(oldestKey);
            }
        }

        this.cache.set(key, { embedding, timestamp: Date.now() });
    }
}

// ──────────────────────────────────────────────────────────────
// Singleton Export
// ──────────────────────────────────────────────────────────────

export const embeddingService = new EmbeddingServiceImpl();

/** Re-export the class for testing (dependency injection) */
export { EmbeddingServiceImpl };
