/**
 * WGA Transparency & Compliance Logger
 * Tracks human vs AI contributions for guild reporting.
 */

export interface ContributionLog {
    id: string;
    projectId: string;
    timestamp: Date;
    actor: 'human' | 'ai';
    model?: string; // e.g. 'claude-3.5', 'gpt-5'
    actionType: 'generate' | 'edit' | 'rewrite';
    contentDelta: number; // char count
    nodeType: 'dialogue' | 'action' | 'scene_heading';
}

export function generateWGAReport(logs: ContributionLog[]) {
    const totalChars = logs.reduce((acc, log) => acc + log.contentDelta, 0);
    const aiChars = logs.filter(l => l.actor === 'ai').reduce((acc, l) => acc + l.contentDelta, 0);
    const humanChars = logs.filter(l => l.actor === 'human').reduce((acc, l) => acc + l.contentDelta, 0);

    const aiPercentage = (aiChars / totalChars) * 100;

    return {
        complianceStatus: aiPercentage > 50 ? 'Warning: High AI Contribution' : 'Standard',
        metrics: {
            totalChars,
            humanChars,
            aiChars,
            aiPercentage: aiPercentage.toFixed(1) + '%',
        },
        modelBreakdown: logs.filter(l => l.actor === 'ai').reduce((acc: any, l) => {
            acc[l.model!] = (acc[l.model!] || 0) + l.contentDelta;
            return acc;
        }, {})
    };
}
