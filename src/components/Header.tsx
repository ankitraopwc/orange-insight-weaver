import { Building, User } from "lucide-react";
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
          className="p-1 hover:bg-orange-100"
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Building className="w-5 h-5 text-primary-foreground" />
          </div>
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