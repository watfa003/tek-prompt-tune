import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ChevronRight,
  FileText,
  TrendingUp,
  Shield,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ChangeRequest {
  id: string;
  week_start: string;
  week_end: string;
  status: string;
  analysis_summary: any;
  findings: any;
  proposed_changes: any;
  master_prompt_diff: string | null;
  strategy_changes: any;
  expected_impact: any;
  risk_assessment: any;
  confidence_score: number;
  created_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
}

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  draft: { color: 'bg-muted text-muted-foreground', icon: FileText },
  submitted: { color: 'bg-amber-500/10 text-amber-500', icon: Clock },
  approved: { color: 'bg-emerald-500/10 text-emerald-500', icon: CheckCircle },
  rejected: { color: 'bg-red-500/10 text-red-500', icon: XCircle },
  implemented: { color: 'bg-blue-500/10 text-blue-500', icon: CheckCircle },
  rolled_back: { color: 'bg-orange-500/10 text-orange-500', icon: AlertTriangle },
};

const AdminChangeRequests: React.FC = () => {
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null);

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
      setChangeRequests(data || []);
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

      toast.success('Weekly change request generated successfully');
      loadChangeRequests();
    } catch (error: any) {
      console.error('Error generating change request:', error);
      toast.error(error.message || 'Failed to generate change request');
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('weekly_change_requests')
        .update({ 
          status: 'approved', 
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.email 
        })
        .eq('id', requestId);

      if (error) throw error;

      // Log to audit
      await supabase.from('admin_audit_log').insert({
        action: 'approve_change_request',
        entity_type: 'weekly_change_requests',
        entity_id: requestId,
        actor_email: user?.email || 'unknown',
        metadata: { status: 'approved' }
      });

      toast.success('Change request approved');
      loadChangeRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('weekly_change_requests')
        .update({ 
          status: 'rejected', 
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.email 
        })
        .eq('id', requestId);

      if (error) throw error;

      // Log to audit
      await supabase.from('admin_audit_log').insert({
        action: 'reject_change_request',
        entity_type: 'weekly_change_requests',
        entity_id: requestId,
        actor_email: user?.email || 'unknown',
        metadata: { status: 'rejected' }
      });

      toast.success('Change request rejected');
      loadChangeRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

  const handleImplement = async (requestId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('weekly_change_requests')
        .update({ 
          status: 'implemented', 
          implemented_at: new Date().toISOString(),
          implemented_by: user?.email 
        })
        .eq('id', requestId);

      if (error) throw error;

      // Log to audit
      await supabase.from('admin_audit_log').insert({
        action: 'implement_change_request',
        entity_type: 'weekly_change_requests',
        entity_id: requestId,
        actor_email: user?.email || 'unknown',
        metadata: { status: 'implemented' }
      });

      toast.success('Changes implemented successfully');
      loadChangeRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error implementing request:', error);
      toast.error('Failed to implement changes');
    }
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
          <p className="text-muted-foreground mt-1">AI-generated proposals for system optimization</p>
        </div>
        <Button 
          onClick={generateWeeklyRequest} 
          disabled={generating}
          className="gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Weekly Request
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
              <p className="text-sm font-medium text-foreground">Owner Approval Required</p>
              <p className="text-sm text-muted-foreground mt-1">
                All AI-generated change proposals require explicit owner sign-off before implementation. 
                Changes are conservative, patch-based, and data-driven.
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
              Generate your first weekly change request to analyze system performance and get AI-powered optimization suggestions.
            </p>
            <Button onClick={generateWeeklyRequest} disabled={generating}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate First Request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-1 space-y-4">
            {changeRequests.map((request) => {
              const StatusIcon = statusConfig[request.status]?.icon || FileText;
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
                          Week of {format(new Date(request.week_start), 'MMM d')} - {format(new Date(request.week_end), 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created {format(new Date(request.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      <Badge className={statusConfig[request.status]?.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {request.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <TrendingUp className="w-3 h-3" />
                        <span>{Math.round(request.confidence_score * 100)}% confidence</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Detail View */}
          <div className="lg:col-span-2">
            {selectedRequest ? (
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>Change Request Details</CardTitle>
                      <CardDescription>
                        Week of {format(new Date(selectedRequest.week_start), 'MMMM d')} - {format(new Date(selectedRequest.week_end), 'MMMM d, yyyy')}
                      </CardDescription>
                    </div>
                    <Badge className={statusConfig[selectedRequest.status]?.color}>
                      {selectedRequest.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Analysis Summary */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Analysis Summary</h4>
                    <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                      {typeof selectedRequest.analysis_summary === 'object' 
                        ? JSON.stringify(selectedRequest.analysis_summary, null, 2)
                        : selectedRequest.analysis_summary || 'No summary available'
                      }
                    </div>
                  </div>

                  {/* Findings */}
                  {selectedRequest.findings && selectedRequest.findings.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">Key Findings</h4>
                      <ul className="space-y-2">
                        {selectedRequest.findings.map((finding: any, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <span>{typeof finding === 'object' ? JSON.stringify(finding) : finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Master Prompt Diff */}
                  {selectedRequest.master_prompt_diff && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">Master Prompt Changes</h4>
                      <pre className="bg-muted/50 rounded-lg p-4 text-xs overflow-x-auto font-mono">
                        {selectedRequest.master_prompt_diff}
                      </pre>
                    </div>
                  )}

                  {/* Risk Assessment */}
                  {selectedRequest.risk_assessment && Object.keys(selectedRequest.risk_assessment).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">Risk Assessment</h4>
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm">
                        <pre className="text-red-400 font-mono text-xs">
                          {JSON.stringify(selectedRequest.risk_assessment, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Confidence Score */}
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium text-foreground">Confidence Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${selectedRequest.confidence_score * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {Math.round(selectedRequest.confidence_score * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {selectedRequest.status === 'submitted' && (
                    <div className="flex items-center gap-3 pt-4 border-t border-border">
                      <Button 
                        onClick={() => handleApprove(selectedRequest.id)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleReject(selectedRequest.id)}
                        className="flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {selectedRequest.status === 'approved' && (
                    <div className="pt-4 border-t border-border">
                      <Button 
                        onClick={() => handleImplement(selectedRequest.id)}
                        className="w-full"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Implement Changes
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card border-border h-full flex items-center justify-center">
                <CardContent className="text-center p-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a change request to view details</p>
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
