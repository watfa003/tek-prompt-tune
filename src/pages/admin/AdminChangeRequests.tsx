import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sparkles, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  TrendingUp,
  TrendingDown,
  Shield,
  Loader2,
  Beaker,
  Target,
  Scale,
  Lightbulb,
  RotateCcw,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';

interface IndividualChange {
  change_id: string;
  change_type: "strategy_weight" | "strategy_apply_step" | "strategy_fix_rule" | "master_prompt_rule" | "target_score";
  target_strategy: string;
  current_value: any;
  proposed_value: any;
  evidence: {
    data_points: number;
    avg_score: number;
    negative_rate: number;
    regression_categories?: string[];
    feedback_themes?: string[];
    pillar_scores?: Record<string, number>;
    research_support?: { modification: string; score_delta: number }[];
  };
  reasoning: string;
  expected_impact: string;
  risk_level: "low" | "medium" | "high";
  status: "pending" | "approved" | "rejected";
  review_notes?: string;
}

interface ChangeRequest {
  id: string;
  week_start: string;
  week_end: string;
  status: string;
  analysis_summary: any;
  findings: any[];
  proposed_changes: any;
  individual_changes: IndividualChange[];
  master_prompt_diff: string | null;
  strategy_changes: any;
  expected_impact: any;
  risk_assessment: any;
  confidence_score: number;
  created_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
  implemented_at: string | null;
  post_implementation_metrics: any;
}

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  draft: { color: 'bg-muted text-muted-foreground', icon: FileText },
  submitted: { color: 'bg-amber-500/10 text-amber-500', icon: Clock },
  approved: { color: 'bg-emerald-500/10 text-emerald-500', icon: CheckCircle },
  rejected: { color: 'bg-red-500/10 text-red-500', icon: XCircle },
  implemented: { color: 'bg-blue-500/10 text-blue-500', icon: CheckCircle },
  rolled_back: { color: 'bg-orange-500/10 text-orange-500', icon: AlertTriangle },
};

const changeTypeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  strategy_weight: { icon: Scale, label: 'Weight Adjustment', color: 'text-blue-500' },
  strategy_apply_step: { icon: Target, label: 'Apply Step', color: 'text-purple-500' },
  strategy_fix_rule: { icon: Lightbulb, label: 'Fix Rule', color: 'text-amber-500' },
  master_prompt_rule: { icon: FileText, label: 'Master Prompt', color: 'text-emerald-500' },
  target_score: { icon: TrendingUp, label: 'Target Score', color: 'text-pink-500' },
};

const riskColors: Record<string, string> = {
  low: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  high: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const AdminChangeRequests: React.FC = () => {
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [implementing, setImplementing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null);
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(new Set());
  const [changeNotes, setChangeNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    loadChangeRequests();
  }, []);

  const loadChangeRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('weekly_change_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const normalized = ((data || []) as any[]).map((r) => ({
        ...r,
        findings: Array.isArray(r.findings) ? r.findings : [],
        individual_changes: Array.isArray(r.individual_changes) ? r.individual_changes : [],
      })) as unknown as ChangeRequest[];

      setChangeRequests(normalized);

      // Auto-select the latest request so changes are immediately visible.
      setSelectedRequest((prev) => {
        if (normalized.length === 0) return null;
        if (!prev) return normalized[0];
        return normalized.find((r) => r.id === prev.id) || normalized[0];
      });
    } catch (error) {
      console.error('Error loading change requests:', error);
      toast.error('Failed to load change requests');
    } finally {
      setLoading(false);
    }
  };

  const generateWeeklyRequest = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('admin-generate-change-request', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) throw response.error;

      toast.success('Weekly change request generated with LLM-powered analysis');
      loadChangeRequests();
    } catch (error: any) {
      console.error('Error generating change request:', error);
      toast.error(error.message || 'Failed to generate change request');
    } finally {
      setGenerating(false);
    }
  };

  const checkAndUpdateRequestStatus = async (updatedChanges: IndividualChange[], requestId: string) => {
    const stats = getApprovalStats(updatedChanges);
    
    // If no pending changes left, mark request as approved (review completed)
    if (stats.pending === 0 && stats.total > 0) {
      try {
        const { error } = await supabase
          .from('weekly_change_requests')
          .update({ 
            status: 'approved',
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', requestId);

        if (error) throw error;
        
        return 'approved';
      } catch (error) {
        console.error('Error updating request status:', error);
      }
    }
    return null;
  };

  const updateChangeStatus = async (changeId: string, newStatus: 'approved' | 'rejected') => {
    if (!selectedRequest) return;

    const updatedChanges = selectedRequest.individual_changes.map(c => {
      if (c.change_id === changeId) {
        return { 
          ...c, 
          status: newStatus,
          review_notes: changeNotes[changeId] || undefined,
        };
      }
      return c;
    });

    try {
      const { error } = await supabase
        .from('weekly_change_requests')
        .update({ individual_changes: updatedChanges as unknown as any })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      // Check if all changes are now signed off
      const newRequestStatus = await checkAndUpdateRequestStatus(updatedChanges, selectedRequest.id);
      const updatedRequest = { 
        ...selectedRequest, 
        individual_changes: updatedChanges,
        ...(newRequestStatus ? { status: newRequestStatus, reviewed_at: new Date().toISOString() } : {})
      };

      setSelectedRequest(updatedRequest);
      setChangeRequests((prev) =>
        prev.map((r) => (r.id === selectedRequest.id ? updatedRequest : r)),
      );
      
      const stats = getApprovalStats(updatedChanges);
      if (stats.pending === 0) {
        toast.success(`Review complete! ${stats.approved} approved, ${stats.rejected} rejected`);
      } else {
        toast.success(`Change ${newStatus}`);
      }
    } catch (error) {
      console.error('Error updating change:', error);
      toast.error('Failed to update change status');
    }
  };

  const approveAllPending = async () => {
    if (!selectedRequest) return;

    const updatedChanges = selectedRequest.individual_changes.map(c => {
      if (c.status === 'pending') {
        return { ...c, status: 'approved' as const };
      }
      return c;
    });

    try {
      // Mark all approved and update request status
      const { error } = await supabase
        .from('weekly_change_requests')
        .update({ 
          individual_changes: updatedChanges as unknown as any,
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      const stats = getApprovalStats(updatedChanges);
      const updatedRequest = { 
        ...selectedRequest, 
        individual_changes: updatedChanges,
        status: 'approved',
        reviewed_at: new Date().toISOString(),
      };

      setSelectedRequest(updatedRequest);
      setChangeRequests((prev) =>
        prev.map((r) => (r.id === selectedRequest.id ? updatedRequest : r)),
      );
      toast.success(`Review complete! ${stats.approved} approved, ${stats.rejected} rejected`);
    } catch (error) {
      toast.error('Failed to approve changes');
    }
  };

  const rejectAllPending = async () => {
    if (!selectedRequest) return;

    const updatedChanges = selectedRequest.individual_changes.map(c => {
      if (c.status === 'pending') {
        return { ...c, status: 'rejected' as const };
      }
      return c;
    });

    try {
      // Mark all rejected and update request status
      const { error } = await supabase
        .from('weekly_change_requests')
        .update({ 
          individual_changes: updatedChanges as unknown as any,
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      const stats = getApprovalStats(updatedChanges);
      const updatedRequest = { 
        ...selectedRequest, 
        individual_changes: updatedChanges,
        status: 'approved',
        reviewed_at: new Date().toISOString(),
      };

      setSelectedRequest(updatedRequest);
      setChangeRequests((prev) =>
        prev.map((r) => (r.id === selectedRequest.id ? updatedRequest : r)),
      );
      toast.success(`Review complete! ${stats.approved} approved, ${stats.rejected} rejected`);
    } catch (error) {
      toast.error('Failed to reject changes');
    }
  };

  const handleImplement = async () => {
    if (!selectedRequest) return;
    
    const approvedCount = selectedRequest.individual_changes.filter(c => c.status === 'approved').length;
    if (approvedCount === 0) {
      toast.error('No approved changes to implement');
      return;
    }

    setImplementing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('admin-implement-changes', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        body: { change_request_id: selectedRequest.id }
      });

      if (response.error) throw response.error;

      toast.success(`${approvedCount} changes implemented successfully`);
      loadChangeRequests();
      setSelectedRequest(null);
    } catch (error: any) {
      console.error('Error implementing changes:', error);
      toast.error(error.message || 'Failed to implement changes');
    } finally {
      setImplementing(false);
    }
  };

  const toggleExpanded = (changeId: string) => {
    const newExpanded = new Set(expandedChanges);
    if (newExpanded.has(changeId)) {
      newExpanded.delete(changeId);
    } else {
      newExpanded.add(changeId);
    }
    setExpandedChanges(newExpanded);
  };

  const getApprovalStats = (changes: IndividualChange[]) => {
    const approved = changes.filter(c => c.status === 'approved').length;
    const rejected = changes.filter(c => c.status === 'rejected').length;
    const pending = changes.filter(c => c.status === 'pending').length;
    return { approved, rejected, pending, total: changes.length };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-40 bg-muted rounded-xl" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Weekly Change Requests</h1>
          <p className="text-muted-foreground mt-1">AI-powered analysis with individual change sign-off</p>
        </div>
        <Button 
          onClick={generateWeeklyRequest} 
          disabled={generating}
          className="gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing with LLM...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Weekly Analysis
            </>
          )}
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Individual Change Sign-off</p>
              <p className="text-sm text-muted-foreground mt-1">
                Each proposed change can be reviewed, approved, or rejected individually with notes. 
                Only approved changes are implemented. LLM-powered analysis provides evidence-based reasoning.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Requests List */}
      {changeRequests.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Change Requests Yet</h3>
            <p className="text-muted-foreground mb-6">
              Generate your first weekly analysis to get AI-powered optimization suggestions with individual change sign-off.
            </p>
            <Button onClick={generateWeeklyRequest} disabled={generating}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate First Analysis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-1 space-y-4">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-3 pr-4">
                {changeRequests.map((request) => {
                  const StatusIcon = statusConfig[request.status]?.icon || FileText;
                  const stats = getApprovalStats(request.individual_changes || []);
                  return (
                    <Card 
                      key={request.id} 
                      className={`bg-card border-border cursor-pointer transition-all hover:border-primary/50 ${
                        selectedRequest?.id === request.id ? 'border-primary ring-1 ring-primary/20' : ''
                      }`}
                      onClick={() => setSelectedRequest(request)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Week of {format(new Date(request.week_start), 'MMM d')} - {format(new Date(request.week_end), 'MMM d')}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(request.created_at), 'MMM d, h:mm a')}
                            </p>
                          </div>
                          <Badge className={statusConfig[request.status]?.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {request.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>{Math.round(request.confidence_score * 100)}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Lightbulb className="w-3 h-3" />
                            <span>{stats.total} changes</span>
                          </div>
                          {stats.approved > 0 && (
                            <div className="flex items-center gap-1 text-emerald-500">
                              <CheckCircle className="w-3 h-3" />
                              <span>{stats.approved}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Detail View */}
          <div className="lg:col-span-2">
            {selectedRequest ? (
              <Card className="bg-card border-border">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Weekly Analysis
                        <Badge className={statusConfig[selectedRequest.status]?.color}>
                          {selectedRequest.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(selectedRequest.week_start), 'MMMM d')} - {format(new Date(selectedRequest.week_end), 'MMMM d, yyyy')}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">
                        {Math.round(selectedRequest.confidence_score * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">confidence</div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Review Summary - shown when review is complete */}
                  {selectedRequest.status === 'approved' && selectedRequest.individual_changes?.length > 0 && (() => {
                    const stats = getApprovalStats(selectedRequest.individual_changes);
                    return (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                          <span className="font-medium text-emerald-500">Review Complete</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="bg-background/50 rounded-lg p-3">
                            <div className="text-2xl font-bold text-emerald-500">{stats.approved}</div>
                            <div className="text-xs text-muted-foreground">Approved</div>
                          </div>
                          <div className="bg-background/50 rounded-lg p-3">
                            <div className="text-2xl font-bold text-red-500">{stats.rejected}</div>
                            <div className="text-xs text-muted-foreground">Rejected</div>
                          </div>
                          <div className="bg-background/50 rounded-lg p-3">
                            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                            <div className="text-xs text-muted-foreground">Total</div>
                          </div>
                        </div>
                        {selectedRequest.reviewed_at && (
                          <div className="text-xs text-muted-foreground mt-3 text-center">
                            Reviewed on {format(new Date(selectedRequest.reviewed_at), 'MMM d, yyyy h:mm a')}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Analysis Summary */}
                  {selectedRequest.analysis_summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-foreground">
                          {selectedRequest.analysis_summary.total_optimizations || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Optimizations</div>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-foreground">
                          {selectedRequest.analysis_summary.avg_score != null ? Number(selectedRequest.analysis_summary.avg_score).toFixed(1) : 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground">Avg Score</div>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-foreground">
                          {selectedRequest.analysis_summary.negative_rate != null ? Number(selectedRequest.analysis_summary.negative_rate).toFixed(1) : 0}%
                        </div>
                        <div className="text-xs text-muted-foreground">Negative Rate</div>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-foreground">
                          {selectedRequest.analysis_summary.strategies_analyzed || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Strategies</div>
                      </div>
                    </div>
                  )}

                  {/* Findings */}
                  {selectedRequest.findings && selectedRequest.findings.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        Key Findings
                      </h4>
                      <div className="space-y-2">
                        {selectedRequest.findings.map((finding: any, i: number) => (
                          <div 
                            key={i} 
                            className={`flex items-start gap-2 text-sm p-2 rounded-lg ${
                              finding.severity === 'high' ? 'bg-red-500/10' : 'bg-amber-500/10'
                            }`}
                          >
                            <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                              finding.severity === 'high' ? 'text-red-500' : 'text-amber-500'
                            }`} />
                            <span className="text-muted-foreground">{finding.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Individual Changes */}
                  {selectedRequest.individual_changes && selectedRequest.individual_changes.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-primary" />
                          Proposed Changes ({selectedRequest.individual_changes.length})
                        </h4>
                        {selectedRequest.status === 'submitted' && (
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={approveAllPending}>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approve All
                            </Button>
                            <Button size="sm" variant="outline" onClick={rejectAllPending}>
                              <XCircle className="w-3 h-3 mr-1" />
                              Reject All
                            </Button>
                          </div>
                        )}
                      </div>

                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3 pr-4">
                          {selectedRequest.individual_changes.map((change, i) => {
                            const typeConfig = changeTypeConfig[change.change_type] || { icon: FileText, label: change.change_type, color: 'text-muted-foreground' };
                            const TypeIcon = typeConfig.icon;
                            const isExpanded = expandedChanges.has(change.change_id);

                            return (
                              <Collapsible 
                                key={change.change_id}
                                open={isExpanded}
                                onOpenChange={() => toggleExpanded(change.change_id)}
                              >
                                <Card className={`border ${
                                  change.status === 'approved' ? 'border-emerald-500/30 bg-emerald-500/5' :
                                  change.status === 'rejected' ? 'border-red-500/30 bg-red-500/5' :
                                  'border-border'
                                }`}>
                                  <div className="flex items-stretch">
                                    <CollapsibleTrigger asChild>
                                      <button type="button" className="flex-1 text-left">
                                        <div className="p-4">
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                              <div className={`p-2 rounded-lg bg-muted ${typeConfig.color}`}>
                                                <TypeIcon className="w-4 h-4" />
                                              </div>
                                              <div className="text-left">
                                                <div className="flex flex-wrap items-center gap-2">
                                                  <span className="font-medium text-foreground">
                                                    {typeConfig.label}: {change.target_strategy}
                                                  </span>
                                                  <Badge className={riskColors[change.risk_level]}>
                                                    {change.risk_level} risk
                                                  </Badge>
                                                  {change.status !== 'pending' && (
                                                    <Badge className={
                                                      change.status === 'approved' 
                                                        ? 'bg-emerald-500/10 text-emerald-500' 
                                                        : 'bg-red-500/10 text-red-500'
                                                    }>
                                                      {change.status}
                                                    </Badge>
                                                  )}
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                  {change.reasoning}
                                                </p>
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-2 text-muted-foreground">
                                              {isExpanded ? (
                                                <ChevronUp className="w-4 h-4" />
                                              ) : (
                                                <ChevronDown className="w-4 h-4" />
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </button>
                                    </CollapsibleTrigger>

                                    {selectedRequest.status === 'submitted' && change.status === 'pending' && (
                                      <div className="p-4 flex items-center gap-2 border-l border-border">
                                        <Button
                                          size="sm"
                                          onClick={() => updateChangeStatus(change.change_id, 'approved')}
                                          aria-label="Approve change"
                                          className="bg-emerald-600 hover:bg-emerald-700"
                                        >
                                          <CheckCircle className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => updateChangeStatus(change.change_id, 'rejected')}
                                          aria-label="Reject change"
                                          className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                                        >
                                          <XCircle className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>

                                  <CollapsibleContent>
                                    <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                                      {/* Current vs Proposed */}
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <div className="text-xs font-medium text-muted-foreground mb-1">Current Value</div>
                                          <div className="bg-muted/50 rounded p-2 text-sm font-mono">
                                            {typeof change.current_value === 'object' 
                                              ? JSON.stringify(change.current_value, null, 2)
                                              : String(change.current_value)}
                                          </div>
                                        </div>
                                        <div>
                                          <div className="text-xs font-medium text-muted-foreground mb-1">Proposed Value</div>
                                          <div className="bg-primary/10 rounded p-2 text-sm font-mono border border-primary/20">
                                            {typeof change.proposed_value === 'object'
                                              ? JSON.stringify(change.proposed_value, null, 2)
                                              : String(change.proposed_value)}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Evidence */}
                                      <div>
                                        <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                          <Beaker className="w-3 h-3" />
                                          Evidence
                                        </div>
                                        <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
                                          <div className="grid grid-cols-3 gap-2">
                                            <div>
                                              <span className="text-muted-foreground">Data points:</span>
                                              <span className="ml-1 font-medium">{change.evidence.data_points}</span>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground">Avg score:</span>
                                              <span className="ml-1 font-medium">{change.evidence.avg_score != null ? Number(change.evidence.avg_score).toFixed(2) : 'N/A'}</span>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground">Negative rate:</span>
                                              <span className="ml-1 font-medium">{change.evidence.negative_rate != null ? (Number(change.evidence.negative_rate) * 100).toFixed(1) : 0}%</span>
                                            </div>
                                          </div>
                                          
                                          {change.evidence.pillar_scores && Object.keys(change.evidence.pillar_scores).length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                              {Object.entries(change.evidence.pillar_scores).map(([pillar, score]) => (
                                                <Badge key={pillar} variant="outline" className="text-xs">
                                                  {pillar}: {score != null ? Number(score).toFixed(1) : 'N/A'}
                                                </Badge>
                                              ))}
                                            </div>
                                          )}

                                          {change.evidence.feedback_themes && change.evidence.feedback_themes.length > 0 && (
                                            <div className="mt-2">
                                              <span className="text-xs text-muted-foreground">Feedback themes:</span>
                                              <div className="flex flex-wrap gap-1 mt-1">
                                                {change.evidence.feedback_themes.slice(0, 3).map((theme, i) => (
                                                  <Badge key={i} variant="secondary" className="text-xs">
                                                    "{theme}"
                                                  </Badge>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {change.evidence.regression_categories && change.evidence.regression_categories.length > 0 && (
                                            <div className="mt-2">
                                              <span className="text-xs text-muted-foreground">Regressions:</span>
                                              <div className="flex flex-wrap gap-1 mt-1">
                                                {change.evidence.regression_categories.map((cat, i) => (
                                                  <Badge key={i} variant="outline" className="text-xs text-red-500 border-red-500/30">
                                                    {cat}
                                                  </Badge>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {change.evidence.research_support && change.evidence.research_support.length > 0 && (
                                            <div className="mt-2 p-2 bg-emerald-500/10 rounded border border-emerald-500/20">
                                              <span className="text-xs text-emerald-500 font-medium">Research Support:</span>
                                              {change.evidence.research_support.map((r, i) => (
                                                <div key={i} className="text-xs text-muted-foreground mt-1">
                                                  "{r.modification}" → +{r.score_delta != null ? Number(r.score_delta).toFixed(2) : 'N/A'} score
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Expected Impact */}
                                      <div className="flex items-center gap-2 text-sm">
                                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                                        <span className="text-muted-foreground">Expected impact:</span>
                                        <span className="font-medium text-emerald-500">{change.expected_impact}</span>
                                      </div>

                                      {/* Notes */}
                                      {selectedRequest.status === 'submitted' && change.status === 'pending' && (
                                        <div>
                                          <Textarea
                                            placeholder="Add review notes (optional)..."
                                            value={changeNotes[change.change_id] || ''}
                                            onChange={(e) => setChangeNotes({
                                              ...changeNotes,
                                              [change.change_id]: e.target.value
                                            })}
                                            className="text-sm h-16"
                                          />
                                        </div>
                                      )}

                                      {/* Actions */}
                                      {selectedRequest.status === 'submitted' && change.status === 'pending' && (
                                        <div className="flex items-center gap-2 pt-2">
                                          <Button 
                                            size="sm"
                                            onClick={() => updateChangeStatus(change.change_id, 'approved')}
                                            className="bg-emerald-600 hover:bg-emerald-700"
                                          >
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Approve
                                          </Button>
                                          <Button 
                                            size="sm"
                                            variant="outline"
                                            onClick={() => updateChangeStatus(change.change_id, 'rejected')}
                                            className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                                          >
                                            <XCircle className="w-3 h-3 mr-1" />
                                            Reject
                                          </Button>
                                        </div>
                                      )}

                                      {change.review_notes && (
                                        <div className="p-2 bg-muted/50 rounded text-sm">
                                          <span className="text-muted-foreground">Review notes:</span>
                                          <span className="ml-2">{change.review_notes}</span>
                                        </div>
                                      )}
                                    </div>
                                  </CollapsibleContent>
                                </Card>
                              </Collapsible>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Post-Implementation Metrics */}
                  {selectedRequest.status === 'implemented' && selectedRequest.post_implementation_metrics && (
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        Impact Metrics (Post-Implementation)
                      </h4>
                      <pre className="text-xs text-muted-foreground">
                        {JSON.stringify(selectedRequest.post_implementation_metrics, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Implementation Actions */}
                  {selectedRequest.status === 'submitted' && (
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {(() => {
                            const stats = getApprovalStats(selectedRequest.individual_changes || []);
                            return (
                              <span>
                                <span className="text-emerald-500 font-medium">{stats.approved} approved</span>
                                {' / '}
                                <span className="text-red-500">{stats.rejected} rejected</span>
                                {' / '}
                                <span>{stats.pending} pending</span>
                              </span>
                            );
                          })()}
                        </div>
                        <Button 
                          onClick={handleImplement}
                          disabled={implementing || getApprovalStats(selectedRequest.individual_changes || []).approved === 0}
                          className="gap-2"
                        >
                          {implementing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Implementing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Implement {getApprovalStats(selectedRequest.individual_changes || []).approved} Approved Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedRequest.status === 'implemented' && (
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center gap-2 text-sm text-emerald-500">
                        <CheckCircle className="w-4 h-4" />
                        <span>
                          Implemented on {format(new Date(selectedRequest.implemented_at!), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card border-border h-full flex items-center justify-center min-h-[500px]">
                <CardContent className="text-center p-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a change request to review individual changes</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminChangeRequests;
