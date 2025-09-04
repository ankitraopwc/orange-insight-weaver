import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { parseTTLToEntities } from '@/lib/ttl-parser';

interface RelationshipGraphProps {
  ttlData?: string;
}

export const RelationshipGraph: React.FC<RelationshipGraphProps> = ({ ttlData }) => {
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());

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
      
      return (
        <div className="space-y-2">
          {sortedEntities.map((entity) => {
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