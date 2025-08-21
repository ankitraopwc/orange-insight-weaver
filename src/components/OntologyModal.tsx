import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OntologyModalProps {
  open: boolean;
  onClose: () => void;
  onOntologyGenerated: (data: any) => void;
}

interface DatabaseData {
  domains: Array<{ id: string; name: string }>;
  valueStreams: Record<string, Array<{ id: string; name: string }>>;
  linesOfBusiness: Record<string, Array<{ id: string; name: string }>>;
  projects: Array<{ id: string; name: string }>;
}

export const OntologyModal = ({ open, onClose, onOntologyGenerated }: OntologyModalProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState("default");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [databaseData, setDatabaseData] = useState<DatabaseData | null>(null);
  
  // Form state
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedValueStream, setSelectedValueStream] = useState("");
  const [selectedLOB, setSelectedLOB] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  
  const { toast } = useToast();

  // Load database data on mount
  useEffect(() => {
    const loadDatabaseData = async () => {
      try {
        const response = await fetch('/data/database.json');
        const data = await response.json();
        setDatabaseData(data);
      } catch (error) {
        console.error('Failed to load database data:', error);
      }
    };
    
    if (open) {
      loadDatabaseData();
      // Load saved selections from localStorage
      const saved = localStorage.getItem('ontology-form-data');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSelectedDomain(parsed.domain || "");
          setSelectedValueStream(parsed.valueStream || "");
          setSelectedLOB(parsed.lob || "");
          setSelectedProject(parsed.project || "");
          setName(parsed.name || "default");
        } catch (error) {
          console.error('Failed to load saved form data:', error);
        }
      }
    }
  }, [open]);

  // Save selections to localStorage
  useEffect(() => {
    const formData = {
      domain: selectedDomain,
      valueStream: selectedValueStream,
      lob: selectedLOB,
      project: selectedProject,
      name
    };
    localStorage.setItem('ontology-form-data', JSON.stringify(formData));
  }, [selectedDomain, selectedValueStream, selectedLOB, selectedProject, name]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file extension instead of MIME type since ZIP MIME type can vary
      const fileName = selectedFile.name.toLowerCase();
      if (fileName.endsWith('.zip')) {
        setFile(selectedFile);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a ZIP file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!file) {
      toast({
        title: "Missing file",
        description: "Please upload a ZIP file.",
        variant: "destructive",
      });
      return;
    }

    if (!formRef.current) return;

    setIsLoading(true);

    try {
      const formData = new FormData(formRef.current);
      
      // Ensure the file is included
      if (file) {
        formData.set("zip_file", file);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 540000); // 540 seconds timeout

      const response = await fetch("http://localhost:8000/generate-ontology", {
        method: "POST",
        body: formData,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        onOntologyGenerated(data.ttl);
        onClose();
        toast({
          title: "Success",
          description: "Ontology generated successfully!",
        });
      } else {
        throw new Error("Failed to generate ontology");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate ontology. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setName("default");
      setFile(null);
      setSelectedDomain("");
      setSelectedValueStream("");
      setSelectedLOB("");
      setSelectedProject("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-xl font-bold text-primary">
            Generate Ontology
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-lg font-medium text-foreground">
              Ontology generation in process...
            </p>
            <p className="text-sm text-muted-foreground">
              This may take a few minutes. Please wait.
            </p>
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="space-y-4 px-4 pb-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="domain" className="text-sm font-medium">
                    Domain
                  </Label>
                  <Select name="domain" value={selectedDomain} onValueChange={(value) => {
                    setSelectedDomain(value);
                    setSelectedValueStream("");
                    setSelectedLOB("");
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {databaseData?.domains.map((domain) => (
                        <SelectItem key={domain.id} value={domain.id}>
                          {domain.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valueStream" className="text-sm font-medium">
                    Value Stream
                  </Label>
                  <Select 
                    name="valueStream" 
                    value={selectedValueStream} 
                    onValueChange={(value) => {
                      setSelectedValueStream(value);
                      setSelectedLOB("");
                    }}
                    disabled={!selectedDomain}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select value stream" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedDomain && databaseData?.valueStreams[selectedDomain]?.map((vs) => (
                        <SelectItem key={vs.id} value={vs.id}>
                          {vs.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lob" className="text-sm font-medium">
                    Line of Business
                  </Label>
                  <Select 
                    name="lob" 
                    value={selectedLOB} 
                    onValueChange={setSelectedLOB}
                    disabled={!selectedValueStream}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select line of business" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedValueStream && databaseData?.linesOfBusiness[selectedValueStream]?.map((lob) => (
                        <SelectItem key={lob.id} value={lob.id}>
                          {lob.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project" className="text-sm font-medium">
                    State/Project
                  </Label>
                  <Select name="project" value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state/project" />
                    </SelectTrigger>
                    <SelectContent>
                      {databaseData?.projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Name (Optional)
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter ontology name"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file" className="text-sm font-medium">
                  Upload ZIP File
                </Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                  <input
                    id="file"
                    name="zip_file"
                    type="file"
                    accept=".zip"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="file"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {file ? file.name : "Click to upload ZIP file"}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 px-4 py-3 border-t border-border bg-background">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-orange-600">
                Generate Ontology
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};