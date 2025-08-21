import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RelationshipGraph } from '@/components/RelationshipGraph';
import { BubbleGraph } from '@/components/BubbleGraph';

interface OntologyWorkspaceProps {
  ttlData?: string;
}

export const OntologyWorkspace: React.FC<OntologyWorkspaceProps> = ({ ttlData }) => {
  const [isHumanReadablePanelOpen, setIsHumanReadablePanelOpen] = useState(true);

  if (!ttlData) {
    return null;
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] relative">
      {/* Human Readable Panel */}
      <div 
        className={`transition-all duration-300 ease-in-out ${
          isHumanReadablePanelOpen ? 'w-72' : 'w-0'
        } overflow-hidden bg-card border-r border-border`}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-card-foreground">
              Ontology Entity Structure
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsHumanReadablePanelOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <RelationshipGraph ttlData={ttlData} />
          </div>
        </div>
      </div>

      {/* Toggle Button for Collapsed Panel */}
      {!isHumanReadablePanelOpen && (
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsHumanReadablePanelOpen(true)}
            className="rounded-l-none rounded-r-lg shadow-lg"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Bubble Graph Panel */}
      <div 
        className={`transition-all duration-300 ease-in-out ${
          isHumanReadablePanelOpen ? 'flex-1' : 'w-full'
        } bg-background`}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">
                Interactive Graph View
              </h3>
              {!isHumanReadablePanelOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsHumanReadablePanelOpen(true)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="flex-1">
            <BubbleGraph ttlData={ttlData} />
          </div>
        </div>
      </div>
    </div>
  );
};