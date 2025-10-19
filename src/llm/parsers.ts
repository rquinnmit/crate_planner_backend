/**
 * LLM Response Parsers
 * 
 * Type-safe parsers for structured LLM responses in CratePilot.
 * Handles JSON extraction, validation, and error recovery.
 */

import { DerivedIntent, CandidatePool, CratePlan } from '../core/crate_planner.ts';
import { CamelotKey } from '../core/track.ts';
import { isValidCamelotKey as validateCamelotKey } from '../utils/camelot.ts';

/**
 * Generic JSON extraction from LLM response
 * Handles cases where LLM includes extra text around JSON
 * 
 * @param response - Raw LLM response text
 * @returns Extracted JSON string
 * @throws Error if no JSON found
 */
export function extractJSON(response: string): string {
    // Try to find JSON object in response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
        throw new Error('No JSON found in LLM response');
    }
    
    return jsonMatch[0];
}

/**
 * Generic parser for LLM responses that contain a list of track IDs and a reasoning string.
 */
function parseTrackIdResponse(
    response: string,
    idKey: string,
    reasoningKey: string,
    context: string
): { ids: string[]; reasoning: string } {
    try {
        const jsonStr = extractJSON(response);
        const parsed = JSON.parse(jsonStr);
        
        if (!Array.isArray(parsed[idKey])) {
            throw new Error(`'${idKey}' must be an array`);
        }
        
        return {
            ids: parsed[idKey],
            reasoning: parsed[reasoningKey] || 'No reasoning provided'
        };
    } catch (error) {
        throw new Error(`Failed to parse ${context}: ${(error as Error).message}`);
    }
}

/**
 * Parse and validate DerivedIntent from LLM response
 * 
 * @param response - Raw LLM response text
 * @returns Parsed and validated DerivedIntent
 * @throws Error if parsing or validation fails
 */
export function parseDerivedIntent(response: string): DerivedIntent {
    try {
        const jsonStr = extractJSON(response);
        const parsed = JSON.parse(jsonStr);
        
        // Validate required fields
        if (!parsed.tempoRange || typeof parsed.tempoRange.min !== 'number' || typeof parsed.tempoRange.max !== 'number') {
            throw new Error('Invalid or missing tempoRange');
        }
        
        if (!parsed.duration || typeof parsed.duration !== 'number') {
            throw new Error('Invalid or missing duration');
        }
        
        // Ensure arrays exist (even if empty)
        const intent: DerivedIntent = {
            tempoRange: parsed.tempoRange,
            allowedKeys: Array.isArray(parsed.allowedKeys) ? parsed.allowedKeys : [],
            targetGenres: Array.isArray(parsed.targetGenres) ? parsed.targetGenres : [],
            duration: parsed.duration,
            mixStyle: parsed.mixStyle || 'smooth',
            mustIncludeArtists: Array.isArray(parsed.mustIncludeArtists) ? parsed.mustIncludeArtists : [],
            avoidArtists: Array.isArray(parsed.avoidArtists) ? parsed.avoidArtists : [],
            mustIncludeTracks: Array.isArray(parsed.mustIncludeTracks) ? parsed.mustIncludeTracks : [],
            avoidTracks: Array.isArray(parsed.avoidTracks) ? parsed.avoidTracks : [],
            energyCurve: parsed.energyCurve || 'linear',
            // Optional Spotify-specific fields
            targetEnergy: typeof parsed.targetEnergy === 'number' ? parsed.targetEnergy : undefined,
            minPopularity: typeof parsed.minPopularity === 'number' ? parsed.minPopularity : undefined,
            targetKeyCamelot: parsed.targetKeyCamelot || undefined
        };
        
        return intent;
    } catch (error) {
        throw new Error(`Failed to parse DerivedIntent: ${(error as Error).message}`);
    }
}

/**
 * Parse candidate pool selection from LLM response
 * 
 * @param response - Raw LLM response text
 * @returns Object with selected track IDs and reasoning
 * @throws Error if parsing fails
 */
export function parseCandidatePoolSelection(response: string): {
    selectedTrackIds: string[];
    reasoning: string;
} {
    const result = parseTrackIdResponse(response, 'selectedTrackIds', 'reasoning', 'candidate pool selection');
    return {
        selectedTrackIds: result.ids,
        reasoning: result.reasoning
    };
}

/**
 * Parse track sequencing from LLM response
 * 
 * @param response - Raw LLM response text
 * @returns Object with ordered track IDs and reasoning
 * @throws Error if parsing fails
 */
export function parseTrackSequence(response: string): {
    orderedTrackIds: string[];
    reasoning: string;
} {
    const result = parseTrackIdResponse(response, 'orderedTrackIds', 'reasoning', 'track sequence');
    return {
        orderedTrackIds: result.ids,
        reasoning: result.reasoning
    };
}

/**
 * Parse plan revision from LLM response
 * 
 * @param response - Raw LLM response text
 * @returns Object with revised track IDs and explanation
 * @throws Error if parsing fails
 */
export function parsePlanRevision(response: string): {
    revisedTrackIds: string[];
    changesExplanation: string;
} {
    const result = parseTrackIdResponse(response, 'revisedTrackIds', 'changesExplanation', 'plan revision');
    return {
        revisedTrackIds: result.ids,
        changesExplanation: result.reasoning
    };
}

/**
 * Validate Camelot key format
 * Re-exported from camelot utils for convenience
 * 
 * @param key - Key string to validate
 * @returns true if valid Camelot key
 */
export function isValidCamelotKey(key: string): key is CamelotKey {
    return validateCamelotKey(key);
}

/**
 * Sanitize and validate track IDs from LLM response
 * Filters out invalid IDs and duplicates
 * 
 * @param trackIds - Array of track IDs from LLM
 * @returns Sanitized array of unique, valid track IDs
 */
export function sanitizeTrackIds(trackIds: string[]): string[] {
    if (!Array.isArray(trackIds)) {
        return [];
    }
    
    // Remove duplicates and filter out invalid IDs
    const seen = new Set<string>();
    const sanitized: string[] = [];
    
    for (const id of trackIds) {
        if (typeof id === 'string' && id.trim().length > 0 && !seen.has(id)) {
            sanitized.push(id.trim());
            seen.add(id);
        }
    }
    
    return sanitized;
}

/**
 * Parse any JSON response with type safety
 * Generic parser for custom response types
 * 
 * @param response - Raw LLM response text
 * @param validator - Optional validation function
 * @returns Parsed object of type T
 * @throws Error if parsing or validation fails
 */
export function parseJSON<T>(
    response: string,
    validator?: (obj: any) => obj is T
): T {
    try {
        const jsonStr = extractJSON(response);
        const parsed = JSON.parse(jsonStr);
        
        if (validator && !validator(parsed)) {
            throw new Error('Validation failed for parsed object');
        }
        
        return parsed as T;
    } catch (error) {
        throw new Error(`Failed to parse JSON: ${(error as Error).message}`);
    }
}

/**
 * Safe JSON parse with fallback
 * Returns fallback value instead of throwing on error
 * 
 * @param response - Raw LLM response text
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback
 */
export function parseJSONSafe<T>(response: string, fallback: T): T {
    try {
        return parseJSON<T>(response);
    } catch (error) {
        console.warn('⚠️ JSON parsing failed, using fallback:', (error as Error).message);
        return fallback;
    }
}

/**
 * Validate LLM response structure before parsing
 * Checks if response likely contains valid JSON
 * 
 * @param response - Raw LLM response text
 * @returns true if response appears to contain JSON
 */
export function hasValidJSON(response: string): boolean {
    try {
        extractJSON(response);
        return true;
    } catch {
        return false;
    }
}

/**
 * Extract and clean text explanation from LLM response
 * Removes JSON and returns just the natural language explanation
 * 
 * @param response - Raw LLM response text
 * @returns Cleaned explanation text
 */
export function extractExplanation(response: string): string {
    // Try to remove JSON if present
    const cleaned = response.replace(/\{[\s\S]*\}/, '').trim();
    return cleaned || response.trim();
}

/**
 * Parse multiple JSON objects from response
 * Handles cases where LLM returns multiple JSON objects
 * 
 * @param response - Raw LLM response text
 * @returns Array of parsed objects
 */
export function parseMultipleJSON<T>(response: string): T[] {
    const results: T[] = [];
    const jsonRegex = /\{[\s\S]*?\}/g;
    const matches = response.match(jsonRegex);
    
    if (!matches) {
        return results;
    }
    
    for (const match of matches) {
        try {
            const parsed = JSON.parse(match);
            results.push(parsed as T);
        } catch (error) {
            // Skip invalid JSON objects
            continue;
        }
    }
    
    return results;
}

/**
 * Validate and normalize BPM range
 * 
 * @param range - BPM range object
 * @returns Normalized BPM range
 * @throws Error if invalid
 */
export function validateBPMRange(range: any): { min: number; max: number } {
    if (!range || typeof range.min !== 'number' || typeof range.max !== 'number') {
        throw new Error('Invalid BPM range');
    }
    
    if (range.min < 0 || range.max < 0 || range.min > range.max) {
        throw new Error('BPM range values must be positive and min <= max');
    }
    
    return {
        min: Math.round(range.min),
        max: Math.round(range.max)
    };
}

/**
 * Validate and normalize duration
 * 
 * @param duration - Duration in seconds
 * @returns Normalized duration
 * @throws Error if invalid
 */
export function validateDuration(duration: any): number {
    if (typeof duration !== 'number' || duration < 0) {
        throw new Error('Duration must be a positive number');
    }
    
    return Math.round(duration);
}

/**
 * Error recovery: attempt to fix common LLM JSON formatting issues
 * 
 * @param response - Raw LLM response text
 * @returns Fixed JSON string or original
 */
export function attemptJSONFix(response: string): string {
    let fixed = response;
    
    // Remove markdown code blocks
    fixed = fixed.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Remove common prefixes
    fixed = fixed.replace(/^(Here's|Here is|The|This is).*?(\{)/i, '$2');
    
    // Try to extract just the JSON part
    const match = fixed.match(/\{[\s\S]*\}/);
    if (match) {
        fixed = match[0];
    }
    
    return fixed;
}
