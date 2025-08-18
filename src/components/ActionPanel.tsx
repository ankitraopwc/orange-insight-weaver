import { Button } from "@/components/ui/button";
import { Brain, Network, Settings, Heart } from "lucide-react";

interface ActionPanelProps {
  onOntologyClick: () => void;
}

export const ActionPanel = ({ onOntologyClick }: ActionPanelProps) => {
  return (
    <div className="bg-orange-50 border-b border-border p-6">
      <div className="flex items-center space-x-4">
        <Button
          onClick={onOntologyClick}
          className="bg-primary hover:bg-orange-600 text-primary-foreground font-medium px-6 py-3"
          size="lg"
        >
          <Brain className="w-5 h-5 mr-2" />
          Ontology
        </Button>
        
        <Button
          variant="outline"
          disabled
          className="border-primary/30 text-muted-foreground cursor-not-allowed px-6 py-3"
          size="lg"
        >
          <Network className="w-5 h-5 mr-2" />
          Knowledge Graph
        </Button>
        
        <Button
          variant="outline"
          disabled
          className="border-primary/30 text-muted-foreground cursor-not-allowed px-6 py-3"
          size="lg"
        >
          <Settings className="w-5 h-5 mr-2" />
          Settings
        </Button>
        
        <Button
          variant="outline"
          disabled
          className="border-primary/30 text-muted-foreground cursor-not-allowed px-6 py-3"
          size="lg"
        >
          <Heart className="w-5 h-5 mr-2" />
          Health Check
        </Button>
      </div>
    </div>
  );
};