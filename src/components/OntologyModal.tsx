import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DatabaseData {
  domains: { id: string; name: string }[];
  valueStreams: { [key: string]: { id: string; name: string }[] };
  linesOfBusiness: { [key: string]: { id: string; name: string }[] };
  projects: { id: string; name: string }[];
}

interface OntologyModalProps {
  open: boolean;
  onClose: () => void;
  onOntologyGenerated: (data: any) => void;
}

export const OntologyModal = ({ open, onClose, onOntologyGenerated }: OntologyModalProps) => {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [valueStream, setValueStream] = useState("");
  const [lob, setLob] = useState("");
  const [project, setProject] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [databaseData, setDatabaseData] = useState<DatabaseData | null>(null);
  const { toast } = useToast();

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

    loadDatabaseData();
  }, []);

  const availableValueStreams = domain && databaseData ? databaseData.valueStreams[domain] || [] : [];
  const availableLOBs = valueStream && databaseData ? databaseData.linesOfBusiness[valueStream] || [] : [];

  // Reset dependent fields when parent changes
  useEffect(() => {
    setValueStream("");
    setLob("");
  }, [domain]);

  useEffect(() => {
    setLob("");
  }, [valueStream]);

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

  const handleSubmit = async () => {
    if (!name || !domain || !valueStream || !lob || !project || !file) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields and upload a ZIP file.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("domain", domain);
      formData.append("valueStream", valueStream);
      formData.append("lob", lob);
      formData.append("project", project);
      formData.append("file", file);

      const response = await fetch("http://localhost:8000/generate-ontology", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onOntologyGenerated(data);
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
      setName("");
      setDomain("");
      setValueStream("");
      setLob("");
      setProject("");
      setFile(null);
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
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4 px-4 pb-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter ontology name"
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="domain" className="text-sm font-medium">
                    Domain
                  </Label>
                  <Select value={domain} onValueChange={setDomain}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select domain" />
                    </SelectTrigger>
                    <SelectContent className="z-[1000] bg-popover text-popover-foreground shadow-md">
                      {databaseData?.domains.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valueStream" className="text-sm font-medium">
                    Value Stream
                  </Label>
                  <Select value={valueStream} onValueChange={setValueStream} disabled={!domain}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select value stream" />
                    </SelectTrigger>
                    <SelectContent className="z-[1000] bg-popover text-popover-foreground shadow-md">
                      {availableValueStreams.map((vs) => (
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
                  <Select value={lob} onValueChange={setLob} disabled={!valueStream}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select LOB" />
                    </SelectTrigger>
                    <SelectContent className="z-[1000] bg-popover text-popover-foreground shadow-md">
                      {availableLOBs.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project" className="text-sm font-medium">
                    Project (State)
                  </Label>
                  <Select value={project} onValueChange={setProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent className="z-[1000] bg-popover text-popover-foreground shadow-md">
                      {databaseData?.projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file" className="text-sm font-medium">
                  Upload ZIP File
                </Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                  <input
                    id="file"
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
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="bg-primary hover:bg-orange-600">
                Generate Ontology
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};