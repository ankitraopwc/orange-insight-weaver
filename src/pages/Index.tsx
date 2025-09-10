import { useState } from "react";
import { Header } from "@/components/Header";
import { ActionPanel } from "@/components/ActionPanel";
import { OntologyModal } from "@/components/OntologyModal";
import { OntologyListModal } from "@/components/OntologyListModal";
import { HierarchySidebar } from "@/components/HierarchySidebar";
import { OntologyWorkspace } from "@/components/OntologyWorkspace";

const Index = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [ttlData, setTtlData] = useState(null);

  const handleOntologyGenerated = (ttlString: string) => {
    setTtlData(ttlString);
  };

const handleSelectOntology = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:8000/download/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to download ontology: ${response.status}`);
      }
      
      const data = await response.json();
      setTtlData(data.ttl);
    } catch (error) {
      console.error('Error downloading ontology:', error);
      // Could add toast notification here for better UX
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <HierarchySidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
      
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-80' : 'ml-0'}`}>
        <ActionPanel 
          onCreateNewClick={() => setIsCreateModalOpen(true)}
          onFetchAllClick={() => setIsListModalOpen(true)}
        />
        
        <main className="min-h-[calc(100vh-8rem)]">
          <OntologyWorkspace ttlData={ttlData} />
        </main>
      </div>

      <OntologyModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onOntologyGenerated={handleOntologyGenerated}
      />

      <OntologyListModal
        open={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        onSelectOntology={handleSelectOntology}
      />
    </div>
  );
};

export default Index;
