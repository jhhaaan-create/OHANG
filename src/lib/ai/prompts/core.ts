// ═══════════════════════════════════════════════════════
// OHANG Core Intelligence — v3.2 (Cleaned)
// Glossary & brand voice now live in archetype.ts system prompt.
// ═══════════════════════════════════════════════════════

// ── 1. Five Elements Interaction ──────────────────────────
export const FIVE_ELEMENTS_MAP = `
## FIVE ELEMENTS (오행) INTERACTION SYSTEM

### GENERATING CYCLE (상생 — feeds/supports):
Wood → Fire → Earth → Metal → Water → Wood
- Wood fuels Fire (inspiration, growth feeding passion)
- Fire creates Earth (passion solidifying into stability)  
- Earth bears Metal (stability producing structure)
- Metal collects Water (structure channeling wisdom)
- Water nourishes Wood (wisdom enabling growth)

### CONTROLLING CYCLE (상극 — restrains/challenges):
Wood → Earth → Water → Fire → Metal → Wood
- Wood penetrates Earth (growth disrupting stability)
- Earth dams Water (stability blocking flow)
- Water extinguishes Fire (emotion overwhelming passion)
- Fire melts Metal (passion breaking structure)
- Metal chops Wood (structure cutting growth)

### WEAKENING CYCLE (설기 — drains/exhausts):
The REVERSE of generating. When the element you feed is too strong, it drains you.
- Wood is drained by Fire (giving too much inspiration)
- Fire is drained by Earth (too much grounding kills spark)
- Earth is drained by Metal (over-structuring depletes warmth)
- Metal is drained by Water (over-thinking corrodes discipline)
- Water is drained by Wood (over-nurturing depletes self)
`;

// ── 2. Void Determination Logic ───────────────────────────
export const YONGSIN_LOGIC = `
## VOID ELEMENT (The Void) DETERMINATION LOGIC

The void element is NOT simply "whichever element has the lowest count."
It is determined by the BALANCE NEEDS of the Day Master:

### STRONG DAY MASTER (신강 — element count of Day Master's type ≥ 4):
The person has TOO MUCH of their own energy. They need the CONTROLLING or DRAINING elements.
- Strong Wood → Needs Metal (to prune/discipline) or Fire (to channel energy outward)
- Strong Fire → Needs Water (to cool/reflect) or Earth (to ground)
- Strong Earth → Needs Wood (to break stagnation) or Metal (to refine)  
- Strong Metal → Needs Fire (to melt rigidity) or Water (to soften)
- Strong Water → Needs Earth (to contain) or Wood (to direct)

### WEAK DAY MASTER (신약 — element count of Day Master's type ≤ 2):
The person lacks their core energy. They need GENERATING or SAME elements.
- Weak Wood → Needs Water (nurture) or more Wood (support)
- Weak Fire → Needs Wood (fuel) or more Fire (confidence)
- Weak Earth → Needs Fire (warmth) or more Earth (stability)
- Weak Metal → Needs Earth (foundation) or more Metal (structure)
- Weak Water → Needs Metal (source) or more Water (depth)

### WHY THIS MATTERS FOR RELATIONSHIPS:
- The void element reveals what a person UNCONSCIOUSLY seeks in a partner.
- People are magnetically attracted to those who carry their void element.
- This explains "why do I always date the same type?" — it's elemental hunger.
- When someone finds a partner whose dominant IS their void → "instant connection" feeling.
- When both share the same void → "we understand each other but can't help each other."
`;

// ── 3. Timing System ──────────────────────────────────────
export const TIMING_SYSTEM = `
## LIFE TIMING SYSTEM (Life Seasons)

### 대운 (Major Luck Cycle — 10-year periods):
Each person enters a new "era" every 10 years based on their birth month pillar.
The element of the current 대운 pillar TRANSFORMS their baseline personality:
- If 대운 element GENERATES Day Master → Growth/expansion era. Confidence rises.
- If 대운 element CONTROLS Day Master → Challenge/pressure era. External obstacles.
- If 대운 element is SAME as Day Master → Amplification era. Traits intensified (good AND bad).
- If Day Master GENERATES 대운 element → Giving/draining era. Energy flows outward.
- If Day Master CONTROLS 대운 element → Power/conquest era. Dominance increases.

### 세운 (Annual Luck — yearly overlay):
Each year has its own element that interacts with BOTH the Day Master AND current 대운.
This creates a "weather forecast" for the year.

### FOR COMPATIBILITY:
Two people may be perfect on paper but meeting in the WRONG 대운 = disaster timing.
Conversely, a mediocre match in the RIGHT 대운 = feels like destiny.
This is why the same couple can break up and reconcile years later — the timing changed.
`;

// ── 4. Insight Triggers ───────────────────────────────────
export const INSIGHT_TRIGGERS = `
## "HOW DID IT KNOW" TRIGGERS

Your analysis MUST include at least ONE insight from the following trigger patterns.
These are SPECIFIC behavioral predictions based on element combinations that feel "psychic" to users.

### VOID ELEMENT → BEHAVIOR TRIGGERS:

1. **Void Water + Fire dominant**: "You rehearse arguments in the shower but go completely blank when the actual conversation happens."
2. **Void Fire + Water dominant**: "Your Notes app is full of unsent texts to people you'll never confront."
3. **Void Wood + Metal dominant**: "You've restarted the same project 4 times because 'this time I'll do it right' but never finish."
4. **Void Metal + Wood dominant**: "Your closet has 3 different 'aesthetic phases' from the last 2 years because you can't commit to one identity."
5. **Void Earth + any dominant**: "People think you're spontaneous. You're actually just anxious and impulsive and learned to brand it as 'adventurous.'"

### ARCHETYPE → RELATIONSHIP TRIGGERS:

6. **The Maverick in love**: "You plan surprise dates but get quietly hurt when they don't plan anything back. You'll never say it though."
7. **The Healer in love**: "You know exactly what your partner needs to hear. The problem is you never say what YOU need."
8. **The Icon in love**: "You've ended relationships over text because the idea of crying in front of someone feels like losing."
9. **The Muse in love**: "You judge potential partners by their taste in music/food/art more than their actual character."
10. **The Voyager in love**: "You get the 'ick' exactly when things start getting comfortable. Coincidence? No."

### ELEMENT BALANCE → LIFE PATTERN TRIGGERS:

11. **3+ Fire, 0 Water**: "You have 47 screenshots of 'motivation quotes' but haven't finished a book in months."
12. **3+ Water, 0 Fire**: "You understand everyone's feelings perfectly except your own. When someone asks 'are you okay?' you panic."
13. **3+ Metal, 0 Wood**: "Your phone screen time is low but your anxiety is high. You mistake discipline for peace."
14. **3+ Wood, 0 Metal**: "You've said 'I'm working on myself' as a reason to avoid commitment at least twice this year."
15. **3+ Earth, 0 Fire**: "People call you 'reliable' and you smile, but inside you're screaming 'I want to be exciting for once.'"

### USAGE RULES:
- Pick the trigger that BEST matches the user's actual element balance and archetype.
- Adapt the language to match the tone (Savage/Balanced/Gentle).
- NEVER use triggers word-for-word. Use them as TEMPLATES and personalize.
- The goal: the user reads it, pauses, and thinks "...that's literally me."
`;
