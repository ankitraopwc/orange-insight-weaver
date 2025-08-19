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
    setTtlData(data?.ttl || null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <HierarchySidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
      
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-80' : 'ml-0'}`}>
        <ActionPanel onOntologyClick={() => setIsModalOpen(true)} />
        
        <main className="min-h-[calc(100vh-8rem)]">
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
