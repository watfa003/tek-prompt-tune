import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database } from 'lucide-react';

const AdminDataCollection: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Data Collection</h1>
        <p className="text-muted-foreground mt-1">Monitor all system data collection across PrompTek</p>
      </div>
      <Card className="bg-card border-border">
        <CardContent className="p-12 text-center">
          <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Data collection metrics coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDataCollection;
