import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Trash2 } from "lucide-react";

interface OntologyListModalProps {
  open: boolean;
  onClose: () => void;
  onSelectOntology: (id: string) => void;
}

const API_BASE_URL = "http://localhost:8000";

export const OntologyListModal = ({ open, onClose, onSelectOntology }: OntologyListModalProps) => {
  const [files, setFiles] = useState<{ filename: string; id: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/files/all`);
      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.status}`);
      }
      
      const data = await response.json();
      // Transform {filename: id} format to array of objects
      const filesArray = Object.entries(data).map(([filename, id]) => ({
        filename,
        id: id as string
      }));
      setFiles(filesArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch files');
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchFiles();
    }
  }, [open]);

  const handleSelectFile = (id: string) => {
    onSelectOntology(id);
    onClose();
  };

  const handleDeleteFile = async (file: { filename: string; id: string }, event: React.MouseEvent) => {
    event.stopPropagation();
    
    setDeletingFiles(prev => new Set(prev).add(file.id));
    
    try {
      const response = await fetch(`${API_BASE_URL}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: file.id }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.status}`);
      }
      
      // Remove file from local list on successful deletion
      setFiles(prev => prev.filter(f => f.id !== file.id));
    } catch (err) {
      console.error('Error deleting file:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    } finally {
      setDeletingFiles(prev => {
        const next = new Set(prev);
        next.delete(file.id);
        return next;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Ontology File</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-full max-h-[60vh]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading ontologies...</span>
            </div>
          )}
          
          {error && (
            <div className="text-destructive py-4 text-center">
              <p>{error}</p>
              <Button onClick={fetchFiles} variant="outline" className="mt-2">
                Retry
              </Button>
            </div>
          )}
          
          {!loading && !error && files.length === 0 && (
            <div className="text-muted-foreground py-8 text-center">
              No ontology files found
            </div>
          )}
          
          {!loading && !error && files.length > 0 && (
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-2 py-4">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleSelectFile(file.id)}
                  >
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="font-medium">{file.filename}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteFile(file, e)}
                        disabled={deletingFiles.has(file.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        {deletingFiles.has(file.id) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="sm">
                        Select
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};