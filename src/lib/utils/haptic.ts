/**
 * BACKWARD COMPATIBILITY LAYER
 *
 * Legacy haptic utility. New code should import from "@/lib/haptics".
 * This file preserves the old `triggerElementalHaptic()` API.
 */

import { haptic } from '@/lib/haptics';
import { ElementType } from '@/lib/constants/archetypes';

export function triggerElementalHaptic(element: ElementType) {
    switch (element) {
        case 'Metal':
            haptic.elementPulse();
            break;
        case 'Fire':
            haptic.reveal();
            break;
        case 'Earth':
            haptic.press();
            break;
        case 'Water':
            haptic.tap();
            break;
        case 'Wood':
            haptic.elementPulse();
            break;
        default:
            haptic.tap();
    }
}

// Re-export new API for convenience
export { haptic };
