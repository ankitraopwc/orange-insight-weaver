import { useState } from "react";
import { ChevronDown, ChevronRight, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
}

const hierarchyData: TreeNode[] = [
  {
    id: "insurance",
    name: "Insurance",
    children: [
      {
        id: "auto",
        name: "Auto",
        children: [
          {
            id: "new-business",
            name: "New Business",
            children: [
              {
                id: "ny",
                name: "NY",
                children: [
                  {
                    id: "ontology",
                    name: "Ontology",
                    children: [
                      { id: "onto1", name: "Onto1" },
                      { id: "onto2", name: "Onto2" }
                    ]
                  },
                  { id: "knowledge-graph", name: "Knowledge Graph" }
                ]
              },
              { id: "tx", name: "TX" }
            ]
          },
          { id: "claim", name: "Claim" },
          { id: "billing", name: "Billing" }
        ]
      },
      { id: "property", name: "Property" },
      { id: "life", name: "Life" }
    ]
  },
  { id: "manufacturing", name: "Manufacturing" },
  { id: "health", name: "Health" }
];

interface TreeItemProps {
  node: TreeNode;
  level: number;
}

const TreeItem = ({ node, level }: TreeItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "flex items-center py-1 px-2 hover:bg-orange-100 rounded cursor-pointer",
          level === 0 && "font-medium"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="w-4 h-4 mr-1" />
          ) : (
            <ChevronRight className="w-4 h-4 mr-1" />
          )
        ) : (
          <span className="w-5 h-4" />
        )}
        <span className="text-sm">{node.name}</span>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeItem key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

interface HierarchySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const HierarchySidebar = ({ isOpen, onToggle }: HierarchySidebarProps) => {
  return (
    <>
      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-sidebar border-r border-sidebar-border transition-transform duration-300 z-40",
          isOpen ? "translate-x-0 w-80" : "-translate-x-full w-0"
        )}
      >
        <div className="p-4 border-b border-sidebar-border">
          <h3 className="font-semibold text-sidebar-foreground">Hierarchy</h3>
        </div>
        <div className="p-2 overflow-y-auto h-full">
          {hierarchyData.map((node) => (
            <TreeItem key={node.id} node={node} level={0} />
          ))}
        </div>
      </div>

      {/* Toggle button when sidebar is closed */}
      {!isOpen && (
        <Button
          onClick={onToggle}
          variant="outline"
          size="sm"
          className="fixed left-4 top-20 z-50 shadow-lg bg-background"
        >
          <PanelLeft className="w-4 h-4" />
        </Button>
      )}

      {/* Overlay when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={onToggle}
        />
      )}
    </>
  );
};