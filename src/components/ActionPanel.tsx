import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Brain, Network, Settings, Heart, ChevronDown } from "lucide-react";

interface ActionPanelProps {
  onCreateNewClick: () => void;
  onFetchAllClick: () => void;
}

export const ActionPanel = ({ onCreateNewClick, onFetchAllClick }: ActionPanelProps) => {
  return (
    <div className="bg-orange-50 border-b border-border p-6 flex justify-center">
      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="bg-primary hover:bg-orange-600 text-primary-foreground font-medium px-6 py-3"
              size="lg"
            >
              <Brain className="w-5 h-5 mr-2" />
              Ontology
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-48 bg-background border shadow-md">
            <DropdownMenuItem onClick={onFetchAllClick} className="cursor-pointer">
              Fetch All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCreateNewClick} className="cursor-pointer">
              Create New
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
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