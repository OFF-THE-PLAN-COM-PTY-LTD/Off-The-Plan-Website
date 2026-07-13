"use client";

import { AccordionSection } from "../fields/accordion-section";
import { AgentManager } from "../managers/agent-manager";
import type { Agent } from "../types";

interface Props {
  isNew: boolean;
  id: string;
  agents: Omit<Agent, "isNew" | "saving" | "deleting">[];
}

export function AgentsSection({ isNew, id, agents }: Props) {
  return (
    <AccordionSection title="Selling Agent(s) / Contact Details">
      {isNew ? (
        <p className="font-sans text-sm text-ink/40 italic">
          Save the listing first to add selling agents.
        </p>
      ) : (
        <AgentManager developmentId={id} initialAgents={agents} />
      )}
    </AccordionSection>
  );
}
