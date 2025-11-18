import { promises as fs } from 'fs';
import path from 'path';
import { getDefaultTemplates, type Template } from './defaultTemplates';
import type { Audience } from '@/types/audience';

const TEMPLATES_FILE = path.join(process.cwd(), 'data', 'templates.json');

export interface CustomTemplates {
  [key: string]: {
    body: string;
  };
}

/**
 * Ensure the data directory exists
 */
async function ensureDataDirectory(): Promise<void> {
  const dataDir = path.dirname(TEMPLATES_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

/**
 * Load custom templates from file storage
 * Returns empty object if file doesn't exist or is invalid
 */
export async function loadCustomTemplates(): Promise<CustomTemplates> {
  try {
    await ensureDataDirectory();
    const content = await fs.readFile(TEMPLATES_FILE, 'utf-8');
    const parsed = JSON.parse(content);

    // Validate structure
    if (typeof parsed !== 'object' || parsed === null) {
      console.warn('[templateStorage] Invalid templates file format, returning empty');
      return {};
    }

    return parsed as CustomTemplates;
  } catch (error) {
    // File doesn't exist or is invalid - return empty
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }
    console.error('[templateStorage] Error loading custom templates:', error);
    return {};
  }
}

/**
 * Save a custom template body for a specific audience
 */
export async function saveCustomTemplate(audience: Audience, body: string): Promise<void> {
  try {
    await ensureDataDirectory();

    // Load existing templates
    const templates = await loadCustomTemplates();

    // Update the specific audience
    templates[audience] = { body };

    // Write back to file
    await fs.writeFile(TEMPLATES_FILE, JSON.stringify(templates, null, 2), 'utf-8');

    console.log(`[templateStorage] Saved custom template for ${audience}`);
  } catch (error) {
    console.error(`[templateStorage] Error saving template for ${audience}:`, error);
    throw new Error(`Failed to save template: ${(error as Error).message}`);
  }
}

/**
 * Reset a template to default by removing custom override
 */
export async function resetTemplate(audience: Audience): Promise<void> {
  try {
    await ensureDataDirectory();

    // Load existing templates
    const templates = await loadCustomTemplates();

    // Remove the custom override
    delete templates[audience];

    // Write back to file
    await fs.writeFile(TEMPLATES_FILE, JSON.stringify(templates, null, 2), 'utf-8');

    console.log(`[templateStorage] Reset template for ${audience} to default`);
  } catch (error) {
    console.error(`[templateStorage] Error resetting template for ${audience}:`, error);
    throw new Error(`Failed to reset template: ${(error as Error).message}`);
  }
}

/**
 * Get effective templates (merge custom with defaults)
 * Custom template bodies override defaults, but keep default metadata
 */
export async function getEffectiveTemplates(): Promise<Record<Audience, Template>> {
  const defaults = getDefaultTemplates();
  const custom = await loadCustomTemplates();

  const result: Record<string, Template> = {};

  // For each audience, merge custom body with default metadata
  for (const [audience, defaultTemplate] of Object.entries(defaults)) {
    const customTemplate = custom[audience];

    result[audience] = {
      ...defaultTemplate,
      // Override body if custom exists
      body: customTemplate?.body ?? defaultTemplate.body,
    };
  }

  return result as Record<Audience, Template>;
}

/**
 * Check if a template has been customized
 */
export async function isTemplateCustomized(audience: Audience): Promise<boolean> {
  const custom = await loadCustomTemplates();
  return audience in custom;
}
