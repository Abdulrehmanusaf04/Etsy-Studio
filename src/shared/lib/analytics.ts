// ============================================
// GPT Mockup Generation — Performance & Cost Analytics
// Tracks timing, cost, retry metrics, and AI vs local split
// ============================================

export interface MockupMetric {
  mockupIndex: number;
  sceneIndex: number;
  attempts: number;
  durationMs: number;
  status: "success" | "failed";
  source: "ai" | "local";
  variationName?: string;
  failureReason?: string;
}

export interface RoundAnalytics {
  round: number;
  startedAt: number;
  completedAt: number;
  totalDurationMs: number;
  requested: number;
  succeeded: number;
  failed: number;
  aiGenerated: number;
  localGenerated: number;
  totalRetries: number;
  mockups: MockupMetric[];
  estimatedCostUsd: number;
}

// gpt-image-2 pricing at LOW quality: ~$0.035 per image
// gpt-4o-mini pricing: ~$0.0002 per OCR/analysis call
const GPT_IMAGE_COST_LOW = 0.035;
const GPT_MINI_TEXT_COST = 0.0002;

export class GenerationAnalytics {
  private roundStart = 0;
  private mockups: MockupMetric[] = [];
  private roundNumber = 0;
  private ocrCalls = 0;

  startRound(round: number): void {
    this.roundStart = Date.now();
    this.roundNumber = round;
    this.mockups = [];
    this.ocrCalls = 0;
  }

  recordOcrCall(): void {
    this.ocrCalls++;
  }

  recordMockup(metric: MockupMetric): void {
    this.mockups.push(metric);
  }

  finishRound(): RoundAnalytics {
    const now = Date.now();
    const succeeded = this.mockups.filter((m) => m.status === "success").length;
    const aiMockups = this.mockups.filter((m) => m.source === "ai");
    const localMockups = this.mockups.filter((m) => m.source === "local");
    const totalRetries = aiMockups.reduce((sum, m) => sum + Math.max(0, m.attempts - 1), 0);

    // Cost: only AI generations cost money (including failed attempts that hit the API)
    const totalAiApiCalls = aiMockups.reduce((sum, m) => sum + m.attempts, 0);
    const estimatedCostUsd =
      totalAiApiCalls * GPT_IMAGE_COST_LOW + this.ocrCalls * GPT_MINI_TEXT_COST;

    const analytics: RoundAnalytics = {
      round: this.roundNumber,
      startedAt: this.roundStart,
      completedAt: now,
      totalDurationMs: now - this.roundStart,
      requested: this.mockups.length,
      succeeded,
      failed: this.mockups.length - succeeded,
      aiGenerated: aiMockups.filter((m) => m.status === "success").length,
      localGenerated: localMockups.filter((m) => m.status === "success").length,
      totalRetries,
      mockups: this.mockups,
      estimatedCostUsd,
    };

    this.printSummary(analytics);
    return analytics;
  }

  private printSummary(a: RoundAnalytics): void {
    const durationSec = (a.totalDurationMs / 1000).toFixed(1);
    const costStr = a.estimatedCostUsd.toFixed(3);

    console.log(`\n╔══════════════════════════════════════════════════════════╗`);
    console.log(`║  GPT MOCKUP GENERATION — ROUND ${a.round} ANALYTICS              ║`);
    console.log(`╠══════════════════════════════════════════════════════════╣`);
    console.log(`║  Total Time:     ${durationSec.padStart(8)}s                            ║`);
    console.log(`║  Success:        ${String(a.succeeded).padStart(8)} / ${a.requested}                          ║`);
    console.log(`║  AI Generated:   ${String(a.aiGenerated).padStart(8)}    ($${(a.aiGenerated * GPT_IMAGE_COST_LOW).toFixed(2)})                  ║`);
    console.log(`║  Local Derived:  ${String(a.localGenerated).padStart(8)}    ($0.00)                  ║`);
    console.log(`║  Failed:         ${String(a.failed).padStart(8)}                                ║`);
    console.log(`║  Total Retries:  ${String(a.totalRetries).padStart(8)}                                ║`);
    console.log(`║  Est. Cost:      $${costStr.padStart(7)}                              ║`);
    console.log(`╠══════════════════════════════════════════════════════════╣`);

    for (const m of a.mockups) {
      const dur = (m.durationMs / 1000).toFixed(1);
      const icon = m.status === "success" ? "✅" : "❌";
      const sourceTag = m.source === "ai" ? "AI" : "LOCAL";
      const retryNote = m.attempts > 1 ? ` (${m.attempts}att)` : "";
      const varNote = m.variationName ? ` [${m.variationName}]` : "";
      console.log(
        `║  ${icon} Mockup ${m.mockupIndex + 1} ${sourceTag.padEnd(5)} — Scene #${String(m.sceneIndex).padStart(2)} — ${dur.padStart(6)}s${retryNote}${varNote}  ║`
      );
    }

    console.log(`╚══════════════════════════════════════════════════════════╝\n`);
  }
}
