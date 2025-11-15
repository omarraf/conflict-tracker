/**
 * Job Scheduler Service
 * Manages scheduled tasks for automatic data updates
 */

import { DataIngestionService } from './ingestion';
import type { WebSocketServer } from 'ws';

export class SchedulerService {
  private ingestionService: DataIngestionService;
  private intervals: NodeJS.Timeout[] = [];
  private isRunning = false;

  constructor(wss: WebSocketServer) {
    this.ingestionService = new DataIngestionService(wss);
  }

  /**
   * Start all scheduled jobs
   */
  start(): void {
    if (this.isRunning) {
      console.log('Scheduler already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting scheduler service...');

    // Daily data ingestion at 2 AM
    this.scheduleDailyIngestion();

    // Hourly check for critical updates (last 2 hours of data)
    this.scheduleHourlyCheck();

    console.log('Scheduler service started');
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping scheduler service...');

    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    this.isRunning = false;

    console.log('Scheduler service stopped');
  }

  /**
   * Schedule daily full data ingestion
   * Runs every 24 hours, fetches last 7 days of data
   */
  private scheduleDailyIngestion(): void {
    // Run immediately on startup
    this.runDailyIngestion();

    // Then run every 24 hours
    const interval = setInterval(() => {
      this.runDailyIngestion();
    }, 24 * 60 * 60 * 1000); // 24 hours

    this.intervals.push(interval);
  }

  /**
   * Schedule hourly checks for recent updates
   * Runs every hour, fetches last 2 hours of data
   */
  private scheduleHourlyCheck(): void {
    // Run first check after 1 hour
    setTimeout(() => {
      this.runHourlyCheck();

      // Then run every hour
      const interval = setInterval(() => {
        this.runHourlyCheck();
      }, 60 * 60 * 1000); // 1 hour

      this.intervals.push(interval);
    }, 60 * 60 * 1000); // Initial 1 hour delay
  }

  /**
   * Execute daily ingestion
   */
  private async runDailyIngestion(): Promise<void> {
    try {
      console.log('='.repeat(50));
      console.log('Running scheduled daily ingestion...');
      console.log(`Time: ${new Date().toISOString()}`);
      console.log('='.repeat(50));

      const results = await this.ingestionService.ingestRecentData(7);

      console.log('Daily ingestion completed:');
      console.log(`  - Added: ${results.added}`);
      console.log(`  - Updated: ${results.updated}`);
      console.log(`  - Errors: ${results.errors}`);
    } catch (error) {
      console.error('Daily ingestion failed:', error);
    }
  }

  /**
   * Execute hourly check for recent updates
   */
  private async runHourlyCheck(): Promise<void> {
    try {
      console.log('Running hourly conflict check...');

      // Only fetch last 2 hours worth of data for quick updates
      const results = await this.ingestionService.ingestRecentData(0.1); // ~2.4 hours

      if (results.added > 0 || results.updated > 0) {
        console.log('Hourly check found updates:');
        console.log(`  - Added: ${results.added}`);
        console.log(`  - Updated: ${results.updated}`);
      }
    } catch (error) {
      console.error('Hourly check failed:', error);
    }
  }

}

let schedulerInstance: SchedulerService | null = null;

/**
 * Get or create the scheduler singleton
 */
export function getScheduler(wss: WebSocketServer): SchedulerService {
  if (!schedulerInstance) {
    schedulerInstance = new SchedulerService(wss);
  }
  return schedulerInstance;
}
