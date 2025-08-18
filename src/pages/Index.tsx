import { useState } from "react";
import { Header } from "@/components/Header";
import { ActionPanel } from "@/components/ActionPanel";
import { OntologyModal } from "@/components/OntologyModal";
import { HierarchySidebar } from "@/components/HierarchySidebar";
import { RelationshipGraph } from "@/components/RelationshipGraph";

const Index = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [ttlData, setTtlData] = useState(null);

  const handleOntologyGenerated = (data: any) => {
    setTtlData(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <ActionPanel onOntologyClick={() => setIsModalOpen(true)} />
      
      <div className="flex">
        <HierarchySidebar 
          isOpen={isSidebarOpen} 
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        />
        
        <main className="flex-1 min-h-[calc(100vh-8rem)]">
          <RelationshipGraph ttlData={ttlData} />
        </main>
      </div>

      <OntologyModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOntologyGenerated={handleOntologyGenerated}
      />
    </div>
  );
};

export default Index;
