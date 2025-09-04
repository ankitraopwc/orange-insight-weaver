import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { parseTTLToEntities } from '@/lib/ttl-parser';

interface RelationshipGraphProps {
  ttlData?: string;
}

export const RelationshipGraph: React.FC<RelationshipGraphProps> = ({ ttlData }) => {
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const toggleClass = (className: string) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(className)) {
      newExpanded.delete(className);
    } else {
      newExpanded.add(className);
    }
    setExpandedClasses(newExpanded);
  };

  const renderHumanReadableFormat = () => {
    if (!ttlData) {
      return null;
    }

    try {
      const parsedData = parseTTLToEntities(ttlData);
      
      if (parsedData.entities.length === 0) {
        return (
          <div className="text-muted-foreground p-4">
            No entities found in TTL data
          </div>
        );
      }

      // Sort entities by number of relationships in descending order
      const sortedEntities = [...parsedData.entities].sort((a, b) => b.relationships.length - a.relationships.length);
      
      // Filter entities based on search query
      const filteredEntities = sortedEntities.filter(entity => {
        if (!searchQuery.trim()) return true;
        
        const query = searchQuery.toLowerCase();
        const matchesName = entity.name.toLowerCase().includes(query);
        const matchesComment = entity.comment?.toLowerCase().includes(query);
        const matchesProperty = entity.properties.some(prop => 
          prop.name.toLowerCase().includes(query) || 
          prop.range?.toLowerCase().includes(query)
        );
        const matchesRelationship = entity.relationships.some(rel => 
          rel.name.toLowerCase().includes(query) || 
          rel.range?.toLowerCase().includes(query)
        );
        
        return matchesName || matchesComment || matchesProperty || matchesRelationship;
      });
      
      return (
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search classes, attributes, relations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Results */}
          <div className="space-y-2">
            {filteredEntities.map((entity) => {
            const isExpanded = expandedClasses.has(entity.name);
            
            return (
              <div key={entity.name} className="border border-border rounded-lg overflow-hidden">
                <div 
                  className="flex items-center cursor-pointer p-3 hover:bg-muted/50 transition-colors"
                  onClick={() => toggleClass(entity.name)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 mr-2 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-2 text-muted-foreground" />
                  )}
                  <h4 className="font-medium text-foreground">{entity.name}</h4>
                </div>
                
                {isExpanded && (
                  <div className="border-t border-border bg-muted/20">
                    {entity.comment && (
                      <div className="p-3 border-b border-border bg-muted/30">
                        <p className="text-sm text-muted-foreground italic">
                          {entity.comment}
                        </p>
                      </div>
                    )}
                    
                    <div className="p-3 space-y-4">
                      {/* Attributes Section */}
                      {entity.properties.length > 0 && (
                        <div>
                          <h5 className="font-medium text-foreground mb-2 text-sm uppercase tracking-wide">
                            Attributes ({entity.properties.length})
                          </h5>
                          <div className="space-y-1">
                            {entity.properties.map((prop, index) => (
                              <div key={index} className="flex items-start gap-2 text-sm">
                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                                <div className="flex-1">
                                  <span className="text-foreground font-mono">{prop.name}</span>
                                  {prop.range && (
                                    <span className="text-muted-foreground ml-2">: {prop.range}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Relations Section */}
                      {entity.relationships.length > 0 && (
                        <div>
                          <h5 className="font-medium text-foreground mb-2 text-sm uppercase tracking-wide">
                            Relations ({entity.relationships.length})
                          </h5>
                          <div className="space-y-1">
                            {entity.relationships.map((rel, index) => (
                              <div key={index} className="flex items-start gap-2 text-sm">
                                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                                <div className="flex-1">
                                  <span className="text-foreground font-mono">{rel.name}</span>
                                  {rel.range && (
                                    <span className="text-muted-foreground ml-2">→ {rel.range}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {entity.properties.length === 0 && entity.relationships.length === 0 && (
                        <p className="text-muted-foreground text-sm text-center py-4">
                          No attributes or relations defined
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
            })}
            
            {filteredEntities.length === 0 && searchQuery.trim() && (
              <div className="text-muted-foreground p-4 text-center">
                No entities found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      );
    } catch (error) {
      console.error("Error parsing TTL for human readable format:", error);
      return (
        <div className="text-destructive p-4 text-center">
          Error parsing TTL data for display
        </div>
      );
    }
  };

  return (
    <div className="h-full p-6 overflow-y-auto">
      {renderHumanReadableFormat()}
    </div>
  );
};