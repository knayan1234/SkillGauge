import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthModal } from '@/features/auth/AuthModal';

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              {/* Logo */}
              <div className="mb-6 flex justify-center">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <div className="h-5 w-5 rounded-md bg-primary/60" />
                </div>
              </div>
              
              {/* Title */}
              <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-2">
                SkillGauge
              </h1>
              
              {/* Subtitle */}
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                Practice interviews tailored to your resume and role
              </p>
              
              {/* CTA */}
              <Button
                onClick={() => setShowAuth(true)}
                className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              {/* Subtle footer */}
              <p className="mt-6 text-xs text-muted-foreground/60">
                AI-powered interview preparation
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <AuthModal open={showAuth} onOpenChange={setShowAuth} />
    </AppLayout>
  );
}
