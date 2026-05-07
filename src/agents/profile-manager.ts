import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse as parseYaml } from 'yaml';

/**
 * Program Profile - the "culture" of a program
 */
export interface ProgramProfile {
  name: string;
  type: string;
  techStack: string[];
  members: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentOverride {
  name: string;
  source: 'system';
  skills?: string[];
  rules?: string;
  commands?: string;
}

export interface ProfileOverrides {
  conventions?: string;
  patterns?: string;
  agents?: AgentOverride[];
}

/**
 * Profile Manager - manages program profiles
 */
export class ProfileManager {
  constructor(private projectRoot: string) {}

  /**
   * Load program profile
   */
  loadProfile(programName: string): ProgramProfile | undefined {
    const profilePath = path.join(
      this.projectRoot,
      'programs',
      programName,
      'profile',
      'profile.json'
    );

    if (!fs.existsSync(profilePath)) {
      return undefined;
    }

    return JSON.parse(fs.readFileSync(profilePath, 'utf-8'));
  }

  /**
   * Save program profile
   */
  async saveProfile(programName: string, profile: ProgramProfile): Promise<void> {
    const profileDir = path.join(
      this.projectRoot,
      'programs',
      programName,
      'profile'
    );
    await fs.promises.mkdir(profileDir, { recursive: true });

    profile.updatedAt = new Date().toISOString();

    await fs.promises.writeFile(
      path.join(profileDir, 'profile.json'),
      JSON.stringify(profile, null, 2),
      'utf-8'
    );
  }

  /**
   * Update profile with new information
   */
  async updateProfile(programName: string, updates: Partial<ProgramProfile>): Promise<void> {
    const profile = this.loadProfile(programName);
    const updated = { ...profile, ...updates, updatedAt: new Date().toISOString() } as ProgramProfile;
    await this.saveProfile(programName, updated);
  }

  /**
   * Get agent overrides for a program
   */
  loadAgentOverrides(programName: string): AgentOverride[] {
    const overridesPath = path.join(
      this.projectRoot,
      'programs',
      programName,
      'profile',
      'agents.yaml'
    );

    if (!fs.existsSync(overridesPath)) {
      return [];
    }

    try {
      const content = fs.readFileSync(overridesPath, 'utf-8');
      const parsed = parseYaml(content);

      if (!parsed || typeof parsed !== 'object') {
        return [];
      }

      const agents = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as Record<string, unknown>).agents)
          ? (parsed as Record<string, unknown>).agents as Array<Record<string, unknown>>
          : [];

      return agents
        .filter((a): a is Record<string, unknown> => typeof a === 'object' && a !== null && typeof a.name === 'string')
        .map(a => ({
          name: a.name as string,
          source: ((a.source as string) || 'system') as 'system',
          skills: Array.isArray(a.skills) ? a.skills as string[] : undefined,
          rules: typeof a.rules === 'string' ? a.rules as string : undefined,
          commands: typeof a.commands === 'string' ? a.commands as string : undefined,
        }));
    } catch {
      return [];
    }
  }

  /**
   * Get conventions for a program
   */
  loadConventions(programName: string): string {
    const conventionsPath = path.join(
      this.projectRoot,
      'programs',
      programName,
      'profile',
      'conventions.md'
    );

    if (!fs.existsSync(conventionsPath)) {
      return '';
    }

    return fs.readFileSync(conventionsPath, 'utf-8');
  }

  /**
   * Update conventions
   */
  async updateConventions(programName: string, conventions: string): Promise<void> {
    const conventionsPath = path.join(
      this.projectRoot,
      'programs',
      programName,
      'profile',
      'conventions.md'
    );

    await fs.promises.writeFile(conventionsPath, conventions, 'utf-8');
  }

  /**
   * Get patterns for a program
   */
  loadPatterns(programName: string): string {
    const patternsPath = path.join(
      this.projectRoot,
      'programs',
      programName,
      'profile',
      'patterns.md'
    );

    if (!fs.existsSync(patternsPath)) {
      return '';
    }

    return fs.readFileSync(patternsPath, 'utf-8');
  }

  /**
   * Update patterns
   */
  async updatePatterns(programName: string, patterns: string): Promise<void> {
    const patternsPath = path.join(
      this.projectRoot,
      'programs',
      programName,
      'profile',
      'patterns.md'
    );

    await fs.promises.writeFile(patternsPath, patterns, 'utf-8');
  }

  /**
   * Add a decision to program memory
   */
  async addDecision(programName: string, decision: string, reason: string): Promise<void> {
    const decisionsDir = path.join(
      this.projectRoot,
      'programs',
      programName,
      'profile',
      'memory',
      'decisions'
    );
    await fs.promises.mkdir(decisionsDir, { recursive: true });

    const filename = `${new Date().toISOString().split('T')[0]}-${Date.now()}.md`;
    const content = `# Decision: ${decision}

**Date:** ${new Date().toISOString()}

**Decision:** ${decision}

**Reason:** ${reason}

`;

    await fs.promises.writeFile(path.join(decisionsDir, filename), content, 'utf-8');
  }

  /**
   * Add a preference to program memory
   */
  async addPreference(programName: string, preference: string, description: string): Promise<void> {
    const prefsDir = path.join(
      this.projectRoot,
      'programs',
      programName,
      'profile',
      'memory',
      'preferences'
    );
    await fs.promises.mkdir(prefsDir, { recursive: true });

    const filename = `${preference.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    const content = `# Preference: ${preference}

**Description:** ${description}

**Added:** ${new Date().toISOString()}

`;

    await fs.promises.writeFile(path.join(prefsDir, filename), content, 'utf-8');
  }

  /**
   * Initialize default profile files
   */
  async initializeProfile(programName: string): Promise<void> {
    const profileDir = path.join(
      this.projectRoot,
      'programs',
      programName,
      'profile'
    );

    await fs.promises.mkdir(path.join(profileDir, 'memory', 'decisions'), { recursive: true });
    await fs.promises.mkdir(path.join(profileDir, 'memory', 'preferences'), { recursive: true });

    // Create default profile.json
    const profile: ProgramProfile = {
      name: programName,
      type: 'general',
      techStack: [],
      members: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await fs.promises.writeFile(
      path.join(profileDir, 'profile.json'),
      JSON.stringify(profile, null, 2),
      'utf-8'
    );

    // Create default conventions
    await fs.promises.writeFile(
      path.join(profileDir, 'conventions.md'),
      '# Conventions\n\nProject-specific conventions and guidelines.\n',
      'utf-8'
    );

    // Create default patterns
    await fs.promises.writeFile(
      path.join(profileDir, 'patterns.md'),
      '# Patterns\n\nCommon patterns used in this project.\n',
      'utf-8'
    );

    // Create default agents.yaml
    await fs.promises.writeFile(
      path.join(profileDir, 'agents.yaml'),
      `# Agent Configuration for ${programName}\n`,
      'utf-8'
    );
  }
}