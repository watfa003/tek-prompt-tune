import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScoreGauge } from '@/components/ui/score-gauge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Copy,
  Check,
  X,
  ArrowRight
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';

interface CategoryScores {
  clarity: number;
  specificity: number;
  efficiency: number;
  structure: number;
  constraints: number;
  elaboration: number;
  intent_alignment: number;
  adaptability: number;
}

interface ComparisonResult {
  before: {
    total_score: number;
    category_breakdown: CategoryScores;
  };
  after: {
    total_score: number;
    category_breakdown: CategoryScores;
  };
}

interface OptimizationComparisonProps {
  comparison: ComparisonResult;
  optimizedPrompt: string;
  onAccept: () => void;
  onReject: () => void;
  isLoading?: boolean;
}

export const OptimizationComparison: React.FC<OptimizationComparisonProps> = ({
  comparison,
  optimizedPrompt,
  onAccept,
  onReject,
  isLoading = false
}) => {
  const { before, after } = comparison;
  const scoreDelta = after.total_score - before.total_score;
  const percentImprovement = ((scoreDelta / before.total_score) * 100).toFixed(1);

  // Calculate category deltas
  const categoryDeltas = Object.keys(before.category_breakdown).map((key) => {
    const k = key as keyof CategoryScores;
    const delta = after.category_breakdown[k] - before.category_breakdown[k];
    return {
      category: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      before: before.category_breakdown[k],
      after: after.category_breakdown[k],
      delta,
      key
    };
  });

  // Sort by improvement (descending)
  const sortedDeltas = [...categoryDeltas].sort((a, b) => b.delta - a.delta);

  // Format radar chart data
  const radarData = Object.keys(before.category_breakdown).map((key) => {
    const k = key as keyof CategoryScores;
    return {
      category: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      before: before.category_breakdown[k],
      after: after.category_breakdown[k],
      fullMark: 10,
    };
  });

  // Count improvements/regressions
  const improvements = categoryDeltas.filter(d => d.delta > 0.2).length;
  const regressions = categoryDeltas.filter(d => d.delta < -0.2).length;
  const noChange = categoryDeltas.filter(d => Math.abs(d.delta) <= 0.2).length;

  const getDeltaBadge = (delta: number) => {
    if (Math.abs(delta) <= 0.2) {
      return (
        <Badge variant="outline" className="gap-1 text-muted-foreground border-muted-foreground/30">
          <Minus className="h-3 w-3" />
          No change
        </Badge>
      );
    } else if (delta > 0) {
      return (
        <Badge className="gap-1 bg-green-500/20 text-green-400 border-green-500/40">
          <TrendingUp className="h-3 w-3" />
          +{delta.toFixed(1)}
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="gap-1">
          <TrendingDown className="h-3 w-3" />
          {delta.toFixed(1)}
        </Badge>
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="glass-card border-primary/30 rounded-[24px] overflow-hidden shadow-[0_0_60px_rgba(110,231,255,0.2)]">
        <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-green-500/10 to-emerald-500/10">
          <CardTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="h-5 w-5 text-green-400" />
            Auto-Optimization Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 p-6 md:p-8">
          
          {/* Overall Score Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center gap-4 p-6 glass-panel rounded-xl">
              <span className="text-sm text-muted-foreground font-medium">Before</span>
              <ScoreGauge score={before.total_score} size="md" />
            </div>
            
            <div className="flex flex-col items-center justify-center gap-3 p-6 glass-panel rounded-xl border-2 border-green-500/30">
              <span className="text-sm text-muted-foreground font-medium">Improvement</span>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400">
                  {scoreDelta > 0 ? '+' : ''}{scoreDelta.toFixed(2)}
                </div>
                <div className="text-sm text-green-400/70 mt-1">
                  {percentImprovement}% increase
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1 text-green-400">
                  <TrendingUp className="h-3 w-3" />
                  {improvements} improved
                </div>
                {regressions > 0 && (
                  <div className="flex items-center gap-1 text-red-400">
                    <TrendingDown className="h-3 w-3" />
                    {regressions} worse
                  </div>
                )}
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Minus className="h-3 w-3" />
                  {noChange} same
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-4 p-6 glass-panel rounded-xl border-2 border-green-500/40">
              <span className="text-sm text-green-400 font-medium">After</span>
              <ScoreGauge score={after.total_score} size="md" />
            </div>
          </div>

          {/* Warning if scores got worse */}
          {regressions >= 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400"
            >
              <div className="flex items-start gap-3">
                <X className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-semibold">Optimization Warning</div>
                  <div className="text-yellow-400/80 mt-1">
                    The optimized prompt scored lower in {regressions} categories. 
                    You may want to try again or keep your original prompt.
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Radar Chart Comparison */}
          <div className="h-[400px] glass-panel rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-4 text-center">Before vs. After Comparison</h3>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <defs>
                  <linearGradient id="beforeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="afterGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <PolarGrid stroke="hsl(var(--primary) / 0.2)" strokeWidth={1.5} />
                <PolarAngleAxis 
                  dataKey="category" 
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 500 }} 
                />
                <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Radar
                  name="Before"
                  dataKey="before"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  fill="url(#beforeGradient)"
                  fillOpacity={0.4}
                />
                <Radar
                  name="After"
                  dataKey="after"
                  stroke="rgb(34, 197, 94)"
                  strokeWidth={2.5}
                  fill="url(#afterGradient)"
                  fillOpacity={0.6}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Category-by-Category Breakdown */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Category Improvements</h3>
            <div className="grid grid-cols-1 gap-3">
              {sortedDeltas.map((item, idx) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-panel rounded-lg p-4 space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{item.category}</span>
                    {getDeltaBadge(item.delta)}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Before</div>
                      <Progress value={item.before * 10} className="h-2" />
                      <div className="text-xs text-muted-foreground mt-1">{item.before.toFixed(1)}/10</div>
                    </div>
                    <div>
                      <div className="text-xs text-green-400 mb-1">After</div>
                      <Progress value={item.after * 10} className="h-2 [&>div]:bg-green-500" />
                      <div className="text-xs text-green-400 mt-1">{item.after.toFixed(1)}/10</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-primary/10">
            <Button
              onClick={onAccept}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90 h-12"
              size="lg"
            >
              <Check className="h-5 w-5 mr-2" />
              Accept Optimized Prompt
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button
              onClick={onReject}
              disabled={isLoading}
              variant="outline"
              className="flex-1 h-12"
              size="lg"
            >
              <X className="h-5 w-5 mr-2" />
              Keep Original
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
