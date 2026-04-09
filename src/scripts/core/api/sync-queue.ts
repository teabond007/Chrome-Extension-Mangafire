/**
 * @fileoverview Centralized Synchronization Queue
 * Manages outgoing sync requests to external APIs with rate limiting and exponential backoff.
 */

export enum SyncPlatform {
    ANILIST = 'anilist',
    MAL = 'mal'
}

export interface SyncTask {
    id: string;
    platform: SyncPlatform;
    action: () => Promise<any>;
    retries: number;
    maxRetries: number;
    nextRetryDelay: number;
}

class SyncQueue {
    private queue: SyncTask[] = [];
    private isProcessing = false;
    private rateLimits: Record<SyncPlatform, { lastRequest: number; interval: number }> = {
        [SyncPlatform.ANILIST]: { lastRequest: 0, interval: 750 },
        [SyncPlatform.MAL]: { lastRequest: 0, interval: 1000 }
    };

    /**
     * Enqueues a new synchronization task.
     */
    enqueue(platform: SyncPlatform, action: () => Promise<any>, taskId?: string) {
        const task: SyncTask = {
            id: taskId || `${platform}-${Date.now()}`,
            platform,
            action,
            retries: 0,
            maxRetries: 5,
            nextRetryDelay: 5000 // Start with 5 seconds
        };

        // Avoid duplicate tasks for the same resource
        if (taskId && this.queue.some(t => t.id === taskId)) {
            console.log(`[SyncQueue] Task ${taskId} already in queue, skipping.`);
            return;
        }

        this.queue.push(task);
        console.log(`[SyncQueue] Task enqueued: ${task.id}. Queue size: ${this.queue.length}`);
        
        if (!this.isProcessing) {
            this.process();
        }
    }

    /**
     * Internal processor loop.
     */
    private async process() {
        if (this.queue.length === 0) {
            this.isProcessing = false;
            console.log('[SyncQueue] Finished processing queue.');
            return;
        }

        this.isProcessing = true;
        const task = this.queue.shift()!;

        // Rate limit check
        const now = Date.now();
        const { lastRequest, interval } = this.rateLimits[task.platform];
        const timeSinceLast = now - lastRequest;

        if (timeSinceLast < interval) {
            const waitTime = interval - timeSinceLast;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        try {
            console.log(`[SyncQueue] Processing task: ${task.id}...`);
            await task.action();
            console.log(`[SyncQueue] Task ${task.id} completed successfully.`);
            this.rateLimits[task.platform].lastRequest = Date.now();
            
            // Continue processing
            setTimeout(() => this.process(), 0);
        } catch (error: any) {
            console.error(`[SyncQueue] Task ${task.id} failed:`, error.message);
            
            if (task.retries < task.maxRetries) {
                task.retries++;
                // Exponential backoff
                const delay = task.nextRetryDelay;
                task.nextRetryDelay *= 2; // Double for next time
                
                console.warn(`[SyncQueue] Retrying task ${task.id} in ${delay / 1000}s (Retry ${task.retries}/${task.maxRetries})`);
                
                setTimeout(() => {
                    this.queue.push(task);
                    if (!this.isProcessing) this.process();
                }, delay);
            } else {
                console.error(`[SyncQueue] Task ${task.id} failed after max retries.`);
            }

            // Continue with other tasks even if one failed
            setTimeout(() => this.process(), 0);
        }
    }
}

export const syncQueue = new SyncQueue();
