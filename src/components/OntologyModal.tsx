import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/zip") {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a ZIP file.",
        variant: "destructive",
      });
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
      <DialogContent className="max-w-2xl w-[80vw] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
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
          <div className="space-y-6 py-4">
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
                <Input
                  id="domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="Enter domain"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valueStream" className="text-sm font-medium">
                  Value Stream
                </Label>
                <Input
                  id="valueStream"
                  value={valueStream}
                  onChange={(e) => setValueStream(e.target.value)}
                  placeholder="Enter value stream"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lob" className="text-sm font-medium">
                  LOB
                </Label>
                <Input
                  id="lob"
                  value={lob}
                  onChange={(e) => setLob(e.target.value)}
                  placeholder="Enter LOB"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project" className="text-sm font-medium">
                  Project
                </Label>
                <Input
                  id="project"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="Enter project"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file" className="text-sm font-medium">
                Upload ZIP File
              </Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
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
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {file ? file.name : "Click to upload ZIP file"}
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
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