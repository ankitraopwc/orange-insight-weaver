import { useState, useRef } from "react";
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
  const [name, setName] = useState("default");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

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
    if (!file) {
      toast({
        title: "Missing file",
        description: "Please upload a ZIP file.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData from form to capture all form fields automatically
      const form = formRef.current;
      const formData = new FormData(form!);
      formData.append("zip_file", file);

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
            <form ref={formRef} className="space-y-4 px-4 pb-2">
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
            </form>

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