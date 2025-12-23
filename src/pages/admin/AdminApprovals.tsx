import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Rocket, RotateCcw, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Approval {
  id: string;
  approval_type: string;
  status: string;
  change_request_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  metadata: any;
}

interface Deployment {
  id: string;
  deployment_type: string;
  status: string;
  deployed_by: string;
  deployed_at: string | null;
  error_message: string | null;
  rollback_at: string | null;
  rollback_by: string | null;
  metadata: any;
}

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  pending: { color: 'bg-amber-500/10 text-amber-500 border-amber-500/30', icon: Clock },
  approved: { color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30', icon: CheckCircle },
  rejected: { color: 'bg-red-500/10 text-red-500 border-red-500/30', icon: XCircle },
  deployed: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/30', icon: Rocket },
  failed: { color: 'bg-red-500/10 text-red-500 border-red-500/30', icon: AlertTriangle },
  rolled_back: { color: 'bg-orange-500/10 text-orange-500 border-orange-500/30', icon: RotateCcw },
};

const AdminApprovals: React.FC = () => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [approvalsRes, deploymentsRes] = await Promise.all([
        supabase.from('admin_approvals').select('*').order('approved_at', { ascending: false }),
        supabase.from('admin_deployments').select('*').order('deployed_at', { ascending: false })
      ]);

      if (approvalsRes.error) throw approvalsRes.error;
      if (deploymentsRes.error) throw deploymentsRes.error;

      setApprovals(approvalsRes.data || []);
      setDeployments(deploymentsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load approvals and deployments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleApprove = async (approval: Approval) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('admin_approvals')
        .update({ 
          status: 'approved', 
          approved_at: new Date().toISOString(),
          approved_by: user?.email 
        })
        .eq('id', approval.id);

      if (error) throw error;

      await supabase.from('admin_audit_log').insert({
        action: 'approve',
        entity_type: 'admin_approvals',
        entity_id: approval.id,
        actor_email: user?.email || 'unknown',
        metadata: { approval_type: approval.approval_type }
      });

      toast.success('Approval granted');
      loadData();
    } catch (error) {
      console.error('Error approving:', error);
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (approval: Approval) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('admin_approvals')
        .update({ 
          status: 'rejected', 
          approved_at: new Date().toISOString(),
          approved_by: user?.email,
          rejection_reason: 'Rejected by owner'
        })
        .eq('id', approval.id);

      if (error) throw error;

      toast.success('Approval rejected');
      loadData();
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error('Failed to reject');
    }
  };

  const handleRollback = async (deployment: Deployment) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('admin_deployments')
        .update({ 
          status: 'rolled_back', 
          rollback_at: new Date().toISOString(),
          rollback_by: user?.email 
        })
        .eq('id', deployment.id);

      if (error) throw error;

      await supabase.from('admin_audit_log').insert({
        action: 'rollback',
        entity_type: 'admin_deployments',
        entity_id: deployment.id,
        actor_email: user?.email || 'unknown',
        metadata: { deployment_type: deployment.deployment_type }
      });

      toast.success('Deployment rolled back');
      loadData();
    } catch (error) {
      console.error('Error rolling back:', error);
      toast.error('Failed to rollback');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-64 bg-muted rounded-xl" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  const pendingApprovals = approvals.filter(a => a.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Approvals & Deployments</h1>
          <p className="text-muted-foreground mt-1">Manage pending approvals and track deployments</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Pending Approvals */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Pending Approvals
            {pendingApprovals.length > 0 && (
              <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30 ml-2">
                {pendingApprovals.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Items requiring owner sign-off</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingApprovals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingApprovals.map((approval) => {
                const StatusIcon = statusConfig[approval.status]?.icon || Clock;
                return (
                  <div key={approval.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                        <StatusIcon className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{approval.approval_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {approval.metadata?.description || 'No description'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleReject(approval)}>
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button size="sm" onClick={() => handleApprove(approval)}>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Deployments */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-blue-500" />
            Recent Deployments
          </CardTitle>
          <CardDescription>Deployment history and status</CardDescription>
        </CardHeader>
        <CardContent>
          {deployments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Rocket className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No deployments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deployments.map((deployment) => {
                const StatusIcon = statusConfig[deployment.status]?.icon || Clock;
                return (
                  <div key={deployment.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        deployment.status === 'deployed' ? 'bg-blue-500/10' :
                        deployment.status === 'failed' ? 'bg-red-500/10' :
                        deployment.status === 'rolled_back' ? 'bg-orange-500/10' :
                        'bg-muted'
                      }`}>
                        <StatusIcon className={`w-5 h-5 ${
                          deployment.status === 'deployed' ? 'text-blue-500' :
                          deployment.status === 'failed' ? 'text-red-500' :
                          deployment.status === 'rolled_back' ? 'text-orange-500' :
                          'text-muted-foreground'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{deployment.deployment_type}</p>
                          <Badge variant="outline" className={statusConfig[deployment.status]?.color}>
                            {deployment.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          by {deployment.deployed_by} • {deployment.deployed_at && format(new Date(deployment.deployed_at), 'MMM d, h:mm a')}
                        </p>
                        {deployment.error_message && (
                          <p className="text-sm text-red-500 mt-1">{deployment.error_message}</p>
                        )}
                      </div>
                    </div>
                    {deployment.status === 'deployed' && (
                      <Button size="sm" variant="outline" onClick={() => handleRollback(deployment)}>
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Rollback
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval History */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Approval History</CardTitle>
          <CardDescription>Past approval decisions</CardDescription>
        </CardHeader>
        <CardContent>
          {approvals.filter(a => a.status !== 'pending').length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No approval history</p>
            </div>
          ) : (
            <div className="space-y-2">
              {approvals.filter(a => a.status !== 'pending').map((approval) => {
                const StatusIcon = statusConfig[approval.status]?.icon || Clock;
                return (
                  <div key={approval.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <StatusIcon className={`w-4 h-4 ${
                        approval.status === 'approved' ? 'text-emerald-500' :
                        approval.status === 'rejected' ? 'text-red-500' :
                        'text-muted-foreground'
                      }`} />
                      <span className="text-foreground">{approval.approval_type}</span>
                      <Badge variant="outline" className={statusConfig[approval.status]?.color}>
                        {approval.status}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {approval.approved_by} • {approval.approved_at && format(new Date(approval.approved_at), 'MMM d')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminApprovals;
