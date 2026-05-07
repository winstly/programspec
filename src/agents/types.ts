/**
 * Agent Definition Types
 */

export interface AgentDefinition {
  name: string;
  stage: string;
  description: string;
  capabilities: string[];
  prompt: string;
  metadata: {
    version: string;
    author: string;
  };
}
