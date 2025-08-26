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

  const handleSelectOntology = (filename: string) => {
    // TODO: Implement loading the selected ontology file
    console.log('Selected ontology:', filename);
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
