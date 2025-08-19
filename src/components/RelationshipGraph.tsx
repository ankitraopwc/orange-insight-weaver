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
          <div className="text-muted-foreground">
            No entities found in TTL data
          </div>
        );
      }

      return (
        <div className="space-y-4">
          {parsedData.entities.map((entity) => {
            const isExpanded = expandedClasses.has(entity.name);
            
            return (
              <div key={entity.name} className="bg-muted/50 p-4 rounded-lg">
                <div 
                  className="flex items-center cursor-pointer mb-3"
                  onClick={() => toggleClass(entity.name)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 mr-2" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-2" />
                  )}
                  <h4 className="font-semibold text-lg text-foreground">{entity.name}</h4>
                </div>
                
                {entity.comment && (
                  <p className="text-sm text-muted-foreground mb-3 ml-6">
                    {entity.comment}
                  </p>
                )}
                
                {isExpanded && (
                  <div className="ml-6 space-y-3">
                    {entity.properties.length > 0 && (
                      <div>
                        <h5 className="font-medium text-foreground mb-2">Properties:</h5>
                        <ul className="space-y-1 ml-4">
                          {entity.properties.slice(0, 10).map((prop, index) => (
                            <li key={index} className="text-muted-foreground text-sm">
                              • {prop.name} {prop.range && `(${prop.range})`}
                            </li>
                          ))}
                          {entity.properties.length > 10 && (
                            <li className="text-muted-foreground text-sm italic">
                              ... and {entity.properties.length - 10} more properties
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                    
                    {entity.relationships.length > 0 && (
                      <div>
                        <h5 className="font-medium text-foreground mb-2">Relationships:</h5>
                        <ul className="space-y-1 ml-4">
                          {entity.relationships.slice(0, 10).map((rel, index) => (
                            <li key={index} className="text-muted-foreground text-sm">
                              • {rel.name} {rel.range && `(${rel.range})`}
                            </li>
                          ))}
                          {entity.relationships.length > 10 && (
                            <li className="text-muted-foreground text-sm italic">
                              ... and {entity.relationships.length - 10} more relationships
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                    
                    {entity.properties.length === 0 && entity.relationships.length === 0 && (
                      <p className="text-muted-foreground text-sm ml-4">No properties or relationships defined</p>
                    )}
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
        <div className="text-muted-foreground">
          Error parsing TTL data for display
        </div>
      );
    }
  };

  return (
    <div className="flex-1">
      {ttlData && (
        <div className="bg-card border border-border rounded-lg h-[calc(100vh-12rem)]">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-card-foreground">
                Ontology Entity Structure
              </h3>
            </div>
          </div>
          <div className="p-6 h-[calc(100%-60px)] overflow-y-auto">
            {renderHumanReadableFormat()}
          </div>
        </div>
      )}
    </div>
  );
};