import { User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onSidebarToggle: () => void;
}

export const Header = ({ onSidebarToggle }: HeaderProps) => {
  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6">
      {/* Left side - Company logo and app name */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSidebarToggle}
          className="p-2 hover:bg-orange-100"
        >
          <img 
            src="/lovable-uploads/org-logo-placeholder.png" 
            alt="Company Logo" 
            className="w-8 h-8 rounded-lg object-cover"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iI0Y5NzMxNiIvPgo8dGV4dCB4PSIxNiIgeT0iMjAiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWkiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtd2VpZ2h0PSI2MDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5MT0dPPC90ZXh0Pgo8L3N2Zz4K';
            }}
          />
        </Button>
        <h1 className="text-2xl font-bold text-primary">iKnow</h1>
      </div>

      {/* Right side - User logo */}
      <div className="flex items-center">
        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-primary" />
        </div>
      </div>
    </header>
  );
};