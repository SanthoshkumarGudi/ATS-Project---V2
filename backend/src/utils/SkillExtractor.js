/**
 * SKILL EXTRACTOR  — skillExtractor.js
 * ─────────────────────────────────────
 * Drop-in replacement for the old SKILL_LIST + extractSkills() combo.
 *
 * Key improvements over the original:
 *   1. Structured dictionary: canonical name → alias array (skillDictionary.js)
 *   2. Two-pass normalization (text-level + alias-level) so punctuation and
 *      spacing variations are handled automatically.
 *   3. Whole-word / whole-phrase boundary matching — prevents "go" matching
 *      inside "algorithm", "java" inside "javascript", etc.
 *   4. Anchor list for short/ambiguous tokens that need context guards.
 *   5. Returns canonical names, not raw matched strings.
 *   6. Pure functions — easy to unit-test.
 */

const SKILL_DICTIONARY = require("./SkillDictionary")

// ─────────────────────────────────────────────────────────────────
// STEP 1 — TEXT NORMALIZER
// ─────────────────────────────────────────────────────────────────
/**
 * Normalize a raw text string so that punctuation quirks and extra
 * whitespace cannot break alias matching.
 *
 * Rules applied (in order):
 *   • Lowercase everything
 *   • Replace   /   ·   •   |   –   —   with a space
 *   • Collapse multiple spaces to one
 *   • DO NOT strip dots/hyphens entirely: "node.js" → keep the dot
 *     but also emit a variant without it (handled in alias lookup)
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[/·•|–—,;()\[\]{}]/g, " ")   // separator characters → space
    .replace(/\s+/g, " ")
    .trim();
}

// ─────────────────────────────────────────────────────────────────
// STEP 2 — ALIAS NORMALIZER
// ─────────────────────────────────────────────────────────────────
/**
 * Normalize a single alias the same way as the resume text,
 * PLUS strip dots/hyphens so "node.js" and "nodejs" both collapse
 * to "nodejs" when compared to the normalized text.
 *
 * We pre-compute this for every alias at startup (see buildIndex).
 */
function normalizeAlias(alias) {
  return normalizeText(alias)
    .replace(/[.\-]/g, "");   // "node.js" → "nodejs", "asp.net" → "aspnet"
}

// ─────────────────────────────────────────────────────────────────
// STEP 3 — BUILD A LOOKUP INDEX  (runs once at module load)
// ─────────────────────────────────────────────────────────────────
/**
 * Index structure:
 *   Map<normalizedAlias → canonicalSkillName>
 *
 * We also produce a variant of the resume text that has dots/hyphens
 * stripped (textStripped) and use it in parallel with the plain
 * normalized text (textPlain). An alias matches if it appears in
 * EITHER variant.
 */
function buildIndex(dictionary) {
  const index = new Map(); // normalizedAlias → canonical

  for (const [canonical, aliases] of Object.entries(dictionary)) {
    for (const alias of aliases) {
      const key = normalizeAlias(alias);
      if (key && !index.has(key)) {
        index.set(key, canonical);
      }
    }
  }
  return index;
}

const ALIAS_INDEX = buildIndex(SKILL_DICTIONARY);

// ─────────────────────────────────────────────────────────────────
// STEP 4 — AMBIGUOUS SHORT-TOKEN ANCHOR LIST
// ─────────────────────────────────────────────────────────────────
/**
 * These normalized aliases are too short / common to match freely.
 * Instead, for each entry we check whether the ORIGINAL (un-normalized)
 * resume text contains the alias as a standalone word with the required
 * surrounding context pattern.
 *
 * Format:  normalizedAlias → RegExp to test against original lowercase text
 */
const ANCHORED_ALIASES = new Map([
  // "go" → only match when it is clearly a language reference
  ["go",        /\b(?:golang|go\s+language|go\s+programming|written\s+in\s+go|proficient\s+in\s+go|experience\s+with\s+go)\b/i],
  // "r"  → only match "R programming", "R language", "R studio"
  ["r",         /\b(?:r\s+programming|r\s+language|r\s+studio|rstudio|r\s+statistical)\b/i],
  // "c"  → only match "C programming", "C language", "ANSI C"
  ["c",         /\b(?:c\s+programming|c\s+language|ansi\s+c)\b/i],
  // "py" → only match if explicitly labelled
  ["py",        /\bpython\b/i],
  // "ml" → standalone "ml" is matched only when near context words
  ["ml",        /\b(?:machine\s+learning|ml\s+model|ml\s+algorithm|ml\s+pipeline)\b/i],
  // "ts" → TypeScript abbreviation, only when labeled
  ["ts",        /\btypescript\b/i],
  // "ng" → Angular abbreviation
  ["ng",        /\bangular\b/i],
  // "dl" → Deep Learning
  ["dl",        /\bdeep\s+learning\b/i],
  // "cv" → Computer Vision (not curriculum vitae)
  ["cv",        /\bcomputer\s+vision\b/i],
  // "pm" → Product Manager context
  ["pm",        /\bproduct\s+manag/i],
  // "ir" → Incident Response
  ["ir",        /\bincident\s+response\b/i],
  // "bd" → Business Development
  ["bd",        /\bbusiness\s+development\b/i],
]);

// ─────────────────────────────────────────────────────────────────
// STEP 5 — WORD-BOUNDARY REGEX BUILDER
// ─────────────────────────────────────────────────────────────────
/**
 * Build a regex that matches `phrase` as a whole word / phrase in text.
 * Works for single words and multi-word phrases.
 * Characters that are special in regex are escaped first.
 */
function buildPhraseRegex(phrase) {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // \b works on word boundaries; for multi-word phrases we rely on the
  // fact that they are surrounded by spaces in the normalized text.
  return new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, "i");
}

// Pre-build regexes for every alias in the index (keyed by normalized alias)
const PHRASE_REGEXES = new Map();
for (const [normalizedAlias] of ALIAS_INDEX) {
  PHRASE_REGEXES.set(normalizedAlias, buildPhraseRegex(normalizedAlias));
}

// ─────────────────────────────────────────────────────────────────
// STEP 6 — PREPARE RESUME TEXT VARIANTS
// ─────────────────────────────────────────────────────────────────
/**
 * Given raw resume text, return two normalized variants:
 *   plain   — normalized but dots/hyphens kept → catches "node.js" matching alias "nodejs"? No.
 *             Actually both are stripped of dots in normalizeAlias, so we strip in text too.
 *   We produce ONE unified stripped text so comparison is always apples-to-apples.
 */
function prepareResumeText(rawText) {
  const plain = normalizeText(rawText);
  const stripped = plain.replace(/[.\-]/g, ""); // remove dots & hyphens
  return { plain, stripped };
}

// ─────────────────────────────────────────────────────────────────
// STEP 7 — MAIN EXTRACTION FUNCTION
// ─────────────────────────────────────────────────────────────────
/**
 * extractSkills(rawText: string) → string[]
 *
 * Returns an array of canonical skill names found in the resume text.
 * Order is deterministic (insertion order of SKILL_DICTIONARY).
 *
 * @param {string} rawText  — full extracted text from pdf-parse
 * @returns {string[]}      — list of canonical skill names
 */
function extractSkills(rawText) {
  const { plain, stripped } = prepareResumeText(rawText);
  const foundCanonicals = new Set();

  for (const [normalizedAlias, canonical] of ALIAS_INDEX) {

    // Already found this skill via another alias — skip
    if (foundCanonicals.has(canonical)) continue;

    // ── ANCHORED ALIASES: require context pattern ──────────────────
    if (ANCHORED_ALIASES.has(normalizedAlias)) {
      const anchorRegex = ANCHORED_ALIASES.get(normalizedAlias);
      if (anchorRegex.test(rawText)) {
        foundCanonicals.add(canonical);
      }
      continue; // do not fall through to general matching
    }

    // ── GENERAL MATCHING ───────────────────────────────────────────
    // We compare the normalized+stripped alias against the stripped text.
    const regex = PHRASE_REGEXES.get(normalizedAlias);

    if (regex && (regex.test(plain) || regex.test(stripped))) {
      foundCanonicals.add(canonical);
    }
  }

  return Array.from(foundCanonicals);
}

// ─────────────────────────────────────────────────────────────────
// STEP 8 — SKILL MATCHING AGAINST JOB REQUIREMENTS
// ─────────────────────────────────────────────────────────────────
/**
 * matchSkills(candidateSkills, jobSkills)
 *
 * Both arrays should be canonical skill names (i.e. output of extractSkills).
 *
 * Returns { matched, missing, matchPercentage, isShortlisted }
 *
 * Note: comparison is case-insensitive on canonical names so minor
 * capitalisation differences never cause misses.
 */
function matchSkills(candidateSkills, jobSkills) {
  const candidateSet = new Set(candidateSkills.map((s) => s.toLowerCase()));

  const matched = jobSkills.filter((js) => candidateSet.has(js.toLowerCase()));
  const missing = jobSkills.filter((js) => !candidateSet.has(js.toLowerCase()));

  const matchPercentage =
    jobSkills.length > 0
      ? Math.round((matched.length / jobSkills.length) * 100)
      : 0;

  const isShortlisted = matchPercentage >= 70;

  return { matched, missing, matchPercentage, isShortlisted };
}

module.exports = { extractSkills, matchSkills, normalizeText, buildIndex };