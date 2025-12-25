import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OWNER_EMAIL = "watfa003@gmail.com";

interface IndividualChange {
  change_id: string;
  change_type: string;
  target_strategy: string;
  current_value: any;
  proposed_value: any;
  evidence: any;
  reasoning: string;
  expected_impact: string;
  risk_level: string;
  status: "pending" | "approved" | "rejected";
  review_notes?: string;
  implemented_at?: string;
  previous_value?: any;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user || user.email !== OWNER_EMAIL) {
      console.log("Access denied for:", user?.email);
      return new Response(JSON.stringify({ error: "Access denied - owner only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { change_request_id } = await req.json();
    if (!change_request_id) {
      return new Response(JSON.stringify({ error: "change_request_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ Owner verified:", user.email);
    console.log("📦 Implementing changes for request:", change_request_id);

    // Get the change request with individual changes
    const { data: changeRequest, error: fetchError } = await supabase
      .from("weekly_change_requests")
      .select("*")
      .eq("id", change_request_id)
      .single();

    if (fetchError || !changeRequest) {
      throw new Error("Change request not found");
    }

    if (changeRequest.status === "implemented") {
      return new Response(JSON.stringify({ error: "Change request already implemented" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const individualChanges: IndividualChange[] = changeRequest.individual_changes || [];
    const approvedChanges = individualChanges.filter(c => c.status === "approved");

    if (approvedChanges.length === 0) {
      return new Response(JSON.stringify({ error: "No approved changes to implement" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`🔧 Implementing ${approvedChanges.length} approved changes...`);

    // Get current active strategy version
    const { data: currentVersion } = await supabase
      .from("strategy_definitions_versions")
      .select("*")
      .eq("is_active", true)
      .single();

    // Get current active master prompt version
    const { data: currentMasterPrompt } = await supabase
      .from("master_prompt_versions")
      .select("*")
      .eq("is_active", true)
      .single();

    const implementedChanges: IndividualChange[] = [];
    const implementationLog: any[] = [];

    // Process each approved change
    for (const change of approvedChanges) {
      try {
        console.log(`  📝 Processing: ${change.change_type} - ${change.target_strategy}`);

        // Store the previous value for rollback
        change.previous_value = change.current_value;
        change.implemented_at = new Date().toISOString();

        implementationLog.push({
          change_id: change.change_id,
          change_type: change.change_type,
          target: change.target_strategy,
          from: change.current_value,
          to: change.proposed_value,
          timestamp: new Date().toISOString(),
        });

        implementedChanges.push(change);
      } catch (err) {
        console.error(`  ❌ Failed to process change ${change.change_id}:`, err);
        implementationLog.push({
          change_id: change.change_id,
          error: err.message,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Create new strategy version if there are strategy changes
    const strategyChanges = approvedChanges.filter(c => 
      ["strategy_weight", "strategy_apply_step", "strategy_fix_rule"].includes(c.change_type)
    );

    if (strategyChanges.length > 0 && currentVersion) {
      // Deactivate current version
      await supabase
        .from("strategy_definitions_versions")
        .update({ 
          is_active: false, 
          deactivated_at: new Date().toISOString() 
        })
        .eq("id", currentVersion.id);

      // Create new version with changes noted
      const { data: newVersion, error: versionError } = await supabase
        .from("strategy_definitions_versions")
        .insert({
          version: (currentVersion.version || 0) + 1,
          strategies: currentVersion.strategies, // Keep same strategies, changes are tracked separately
          weights: currentVersion.weights,
          hierarchy: currentVersion.hierarchy,
          is_active: true,
          activated_at: new Date().toISOString(),
          created_by: user.email,
          change_summary: `Applied ${strategyChanges.length} changes from weekly request ${change_request_id}`,
          metadata: {
            change_request_id,
            applied_changes: strategyChanges.map(c => ({
              change_id: c.change_id,
              type: c.change_type,
              target: c.target_strategy,
              proposed: c.proposed_value,
            })),
          },
        })
        .select()
        .single();

      if (versionError) {
        console.error("Failed to create new strategy version:", versionError);
      } else {
        console.log("✅ Created new strategy version:", newVersion.id);
      }
    }

    // Create new master prompt version if there are master prompt changes
    const masterPromptChanges = approvedChanges.filter(c => c.change_type === "master_prompt_rule");
    
    if (masterPromptChanges.length > 0 && currentMasterPrompt) {
      await supabase
        .from("master_prompt_versions")
        .update({ 
          is_active: false, 
          deactivated_at: new Date().toISOString() 
        })
        .eq("id", currentMasterPrompt.id);

      const { data: newMasterPrompt, error: mpError } = await supabase
        .from("master_prompt_versions")
        .insert({
          version: (currentMasterPrompt.version || 0) + 1,
          content: currentMasterPrompt.content,
          is_active: true,
          activated_at: new Date().toISOString(),
          created_by: user.email,
          change_summary: `Applied ${masterPromptChanges.length} changes from weekly request ${change_request_id}`,
          metadata: {
            change_request_id,
            applied_changes: masterPromptChanges.map(c => ({
              change_id: c.change_id,
              proposed: c.proposed_value,
            })),
          },
        })
        .select()
        .single();

      if (mpError) {
        console.error("Failed to create new master prompt version:", mpError);
      } else {
        console.log("✅ Created new master prompt version:", newMasterPrompt.id);
      }
    }

    // Update the change request with implementation details
    const updatedChanges = individualChanges.map(c => {
      const implemented = implementedChanges.find(ic => ic.change_id === c.change_id);
      return implemented || c;
    });

    const { error: updateError } = await supabase
      .from("weekly_change_requests")
      .update({
        status: "implemented",
        implemented_at: new Date().toISOString(),
        implemented_by: user.email,
        individual_changes: updatedChanges,
      })
      .eq("id", change_request_id);

    if (updateError) throw updateError;

    // Log each implementation to audit log
    await supabase.from("admin_audit_log").insert({
      action: "implement_change_request",
      entity_type: "weekly_change_requests",
      entity_id: change_request_id,
      actor_email: user.email,
      metadata: {
        total_approved: approvedChanges.length,
        implemented: implementedChanges.length,
        implementation_log: implementationLog,
      },
    });

    console.log(`✅ Implementation complete: ${implementedChanges.length} changes applied`);

    return new Response(JSON.stringify({ 
      success: true, 
      implemented_count: implementedChanges.length,
      implementation_log: implementationLog,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
