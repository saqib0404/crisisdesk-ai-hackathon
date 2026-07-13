import { prisma } from "../config/prisma.js";


/**
 * Score configuration
 */
const DESCRIPTION_WEIGHT = 0.55;
const LOCATION_WEIGHT = 0.25;
const CATEGORY_WEIGHT = 0.15;
const TIME_WEIGHT = 0.05;

const getNumberFromEnvironment = (
    value: string | undefined,
    fallback: number,
): number => {
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue)
        ? parsedValue
        : fallback;
};

const clamp = (
    value: number,
    minimum: number,
    maximum: number,
): number => {
    return Math.min(
        Math.max(value, minimum),
        maximum,
    );
};

const roundScore = (
    value: number,
): number => {
    return Number(value.toFixed(4));
};

const DUPLICATE_THRESHOLD = clamp(
    getNumberFromEnvironment(
        process.env.DUPLICATE_THRESHOLD,
        0.62,
    ),
    0,
    1,
);

const DUPLICATE_LOOKBACK_HOURS = Math.max(
    1,
    getNumberFromEnvironment(
        process.env.DUPLICATE_LOOKBACK_HOURS,
        48,
    ),
);

const DUPLICATE_CANDIDATE_LIMIT = Math.max(
    1,
    Math.floor(
        getNumberFromEnvironment(
            process.env.DUPLICATE_CANDIDATE_LIMIT,
            100,
        ),
    ),
);

const MIN_LOCATION_SIMILARITY = clamp(
    getNumberFromEnvironment(
        process.env
            .DUPLICATE_MIN_LOCATION_SIMILARITY,
        0.35,
    ),
    0,
    1,
);

const MIN_DESCRIPTION_SIMILARITY = clamp(
    getNumberFromEnvironment(
        process.env
            .DUPLICATE_MIN_DESCRIPTION_SIMILARITY,
        0.25,
    ),
    0,
    1,
);

/**
 * Common words that usually do not help
 * distinguish one emergency from another.
 */
const STOP_WORDS = new Set([
    // English
    "a",
    "an",
    "the",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "there",
    "here",
    "this",
    "that",
    "these",
    "those",
    "and",
    "or",
    "but",
    "of",
    "to",
    "in",
    "on",
    "at",
    "from",
    "near",
    "with",
    "for",
    "by",
    "as",
    "it",
    "its",
    "has",
    "have",
    "had",
    "some",
    "several",
    "reported",
    "report",

    // Bangla
    "একটি",
    "একজন",
    "এবং",
    "আছে",
    "হয়েছে",
    "হয়েছে",
    "এই",
    "ওই",
    "এর",
    "তে",
    "থেকে",
    "কাছে",
    "সেখানে",
    "কিছু",
]);

/**
 * Convert common related words into one
 * standard form.
 *
 * This helps:
 * burning → fire
 * store → shop
 * collision → crash
 */
const SYNONYM_MAP: Record<string, string> = {
    burning: "fire",
    burned: "fire",
    blaze: "fire",
    flames: "fire",
    flame: "fire",

    store: "shop",
    stores: "shop",
    shops: "shop",

    collision: "crash",
    collided: "crash",
    accident: "crash",
    crashed: "crash",

    injured: "injury",
    wounded: "injury",
    hurt: "injury",

    stuck: "trapped",

    outage: "blackout",
    electricity: "power",
    electrical: "power",

    waterlogging: "flood",
    flooded: "flood",
    flooding: "flood",
};

/**
 * Standardize text for comparison.
 *
 * Unicode support keeps Bangla and English
 * letters while removing punctuation.
 */
export const normalizeSimilarityText = (
    value: string,
): string => {
    return value
        .normalize("NFKC")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
};

const createTokenSet = (
    value: string,
): Set<string> => {
    const normalizedValue =
        normalizeSimilarityText(value);

    if (!normalizedValue) {
        return new Set();
    }

    const tokens = normalizedValue
        .split(" ")
        .map((token) => {
            return SYNONYM_MAP[token] ?? token;
        })
        .filter((token) => {
            return (
                token.length > 1 &&
                !STOP_WORDS.has(token)
            );
        });

    return new Set(tokens);
};

const calculateIntersectionSize = (
    firstSet: Set<string>,
    secondSet: Set<string>,
): number => {
    let intersectionSize = 0;

    for (const item of firstSet) {
        if (secondSet.has(item)) {
            intersectionSize += 1;
        }
    }

    return intersectionSize;
};

/**
 * Overlap coefficient:
 *
 * shared tokens / smaller token-set size
 *
 * This works better than strict equality when
 * one report contains more detail than another.
 */
const calculateTokenOverlap = (
    firstValue: string,
    secondValue: string,
): number => {
    const firstTokens =
        createTokenSet(firstValue);

    const secondTokens =
        createTokenSet(secondValue);

    if (
        firstTokens.size === 0 ||
        secondTokens.size === 0
    ) {
        return 0;
    }

    const intersectionSize =
        calculateIntersectionSize(
            firstTokens,
            secondTokens,
        );

    const smallerSetSize = Math.min(
        firstTokens.size,
        secondTokens.size,
    );

    return intersectionSize / smallerSetSize;
};

/**
 * Create groups of three characters.
 *
 * Example:
 * "fire" → "fir", "ire"
 */
const createCharacterNgrams = (
    value: string,
    ngramSize = 3,
): Set<string> => {
    const normalizedValue =
        normalizeSimilarityText(value);

    if (!normalizedValue) {
        return new Set();
    }

    if (
        normalizedValue.length <= ngramSize
    ) {
        return new Set([normalizedValue]);
    }

    const ngrams = new Set<string>();

    for (
        let index = 0;
        index <=
        normalizedValue.length - ngramSize;
        index += 1
    ) {
        ngrams.add(
            normalizedValue.slice(
                index,
                index + ngramSize,
            ),
        );
    }

    return ngrams;
};

/**
 * Dice coefficient for character groups.
 */
const calculateCharacterSimilarity = (
    firstValue: string,
    secondValue: string,
): number => {
    const firstNgrams =
        createCharacterNgrams(firstValue);

    const secondNgrams =
        createCharacterNgrams(secondValue);

    if (
        firstNgrams.size === 0 ||
        secondNgrams.size === 0
    ) {
        return 0;
    }

    const intersectionSize =
        calculateIntersectionSize(
            firstNgrams,
            secondNgrams,
        );

    return (
        (2 * intersectionSize) /
        (firstNgrams.size + secondNgrams.size)
    );
};

/**
 * General text similarity:
 *
 * 65% token overlap
 * 35% character similarity
 */
export const calculateTextSimilarity = (
    firstValue: string,
    secondValue: string,
): number => {
    const firstNormalized =
        normalizeSimilarityText(firstValue);

    const secondNormalized =
        normalizeSimilarityText(secondValue);

    if (
        !firstNormalized ||
        !secondNormalized
    ) {
        return 0;
    }

    if (
        firstNormalized === secondNormalized
    ) {
        return 1;
    }

    const tokenSimilarity =
        calculateTokenOverlap(
            firstNormalized,
            secondNormalized,
        );

    const characterSimilarity =
        calculateCharacterSimilarity(
            firstNormalized,
            secondNormalized,
        );

    const result =
        tokenSimilarity * 0.65 +
        characterSimilarity * 0.35;

    return roundScore(clamp(result, 0, 1));
};

/**
 * Location comparison receives a boost when one
 * location contains the other.
 *
 * Examples:
 * "Bondor Bazar"
 * "Sylhet Bondor Bazar"
 */
const calculateLocationSimilarity = (
    firstLocation: string,
    secondLocation: string,
): number => {
    const firstNormalized =
        normalizeSimilarityText(firstLocation);

    const secondNormalized =
        normalizeSimilarityText(secondLocation);

    if (
        !firstNormalized ||
        !secondNormalized
    ) {
        return 0;
    }

    if (
        firstNormalized === secondNormalized
    ) {
        return 1;
    }

    const standardSimilarity =
        calculateTextSimilarity(
            firstNormalized,
            secondNormalized,
        );

    const containsOtherLocation =
        firstNormalized.includes(
            secondNormalized,
        ) ||
        secondNormalized.includes(
            firstNormalized,
        );

    if (containsOtherLocation) {
        return roundScore(
            Math.max(
                standardSimilarity,
                0.9,
            ),
        );
    }

    return standardSimilarity;
};

/**
 * Recent reports receive a higher time score.
 *
 * Score:
 * now        → 1
 * 24 hours   → approximately 0.5
 * 48 hours   → 0
 */
const calculateTimeSimilarity = (
    candidateCreatedAt: Date,
    currentTime: Date,
): number => {
    const ageInMilliseconds =
        Math.abs(
            currentTime.getTime() -
            candidateCreatedAt.getTime(),
        );

    const ageInHours =
        ageInMilliseconds /
        (1000 * 60 * 60);

    const similarity =
        1 -
        Math.min(
            ageInHours /
            DUPLICATE_LOOKBACK_HOURS,
            1,
        );

    return roundScore(
        clamp(similarity, 0, 1),
    );
};

export interface DuplicateDetectionInput {
    location: string;
    description: string;
    summary: string;
    category: string;
}

export interface SimilarityBreakdown {
    descriptionSimilarity: number;
    locationSimilarity: number;
    categorySimilarity: number;
    timeSimilarity: number;
}

export interface DuplicateDetectionResult {
    possibleDuplicate: boolean;
    matchedReportId: string | null;
    duplicateScore: number | null;

    threshold: number;
    evaluatedCandidates: number;

    breakdown:
    | SimilarityBreakdown
    | null;
}

/**
 * Detect the strongest possible duplicate.
 */
export const detectPossibleDuplicate = async (
    input: DuplicateDetectionInput,
): Promise<DuplicateDetectionResult> => {
    const currentTime = new Date();

    const lookbackStart = new Date(
        currentTime.getTime() -
        DUPLICATE_LOOKBACK_HOURS *
        60 *
        60 *
        1000,
    );

    /**
     * Only compare against recent reports.
     *
     * Rejected reports are excluded because they
     * are not considered valid incidents.
     */
    const candidates =
        await prisma.report.findMany({
            where: {
                createdAt: {
                    gte: lookbackStart,
                },

                status: {
                    not: "rejected",
                },
            },

            select: {
                id: true,
                matchedReportId: true,

                location: true,
                normalizedLocation: true,

                description: true,
                normalizedDescription: true,
                summary: true,

                category: true,
                createdAt: true,
            },

            orderBy: {
                createdAt: "desc",
            },

            take: DUPLICATE_CANDIDATE_LIMIT,
        });

    if (candidates.length === 0) {
        return {
            possibleDuplicate: false,
            matchedReportId: null,
            duplicateScore: null,
            threshold: DUPLICATE_THRESHOLD,
            evaluatedCandidates: 0,
            breakdown: null,
        };
    }

    const newDescriptionText = [
        input.description,
        input.summary,
    ].join(" ");

    let strongestMatch:
        | {
            candidateId: string;
            canonicalReportId: string;
            score: number;
            breakdown: SimilarityBreakdown;
        }
        | null = null;

    for (const candidate of candidates) {
        /**
         * Include AI summaries because both Bangla
         * and English reports receive English summaries.
         *
         * This improves cross-language comparison.
         */
        const candidateDescriptionText = [
            candidate.normalizedDescription ??
            candidate.description,

            candidate.summary ?? "",
        ].join(" ");

        const descriptionSimilarity =
            calculateTextSimilarity(
                newDescriptionText,
                candidateDescriptionText,
            );

        const locationSimilarity =
            calculateLocationSimilarity(
                input.location,
                candidate.normalizedLocation ??
                candidate.location,
            );

        const categorySimilarity =
            candidate.category === input.category
                ? 1
                : 0;

        const timeSimilarity =
            calculateTimeSimilarity(
                candidate.createdAt,
                currentTime,
            );

        const score = roundScore(
            descriptionSimilarity *
            DESCRIPTION_WEIGHT +
            locationSimilarity *
            LOCATION_WEIGHT +
            categorySimilarity *
            CATEGORY_WEIGHT +
            timeSimilarity * TIME_WEIGHT,
        );

        const breakdown: SimilarityBreakdown = {
            descriptionSimilarity,
            locationSimilarity,
            categorySimilarity,
            timeSimilarity,
        };

        if (
            !strongestMatch ||
            score > strongestMatch.score
        ) {
            strongestMatch = {
                candidateId: candidate.id,

                /**
                 * Avoid duplicate chains.
                 *
                 * When the candidate is already a duplicate,
                 * point to its original matched report.
                 */
                canonicalReportId:
                    candidate.matchedReportId ??
                    candidate.id,

                score,
                breakdown,
            };
        }
    }

    if (!strongestMatch) {
        return {
            possibleDuplicate: false,
            matchedReportId: null,
            duplicateScore: null,
            threshold: DUPLICATE_THRESHOLD,
            evaluatedCandidates:
                candidates.length,
            breakdown: null,
        };
    }

    const passesFinalThreshold =
        strongestMatch.score >=
        DUPLICATE_THRESHOLD;

    const passesLocationRequirement =
        strongestMatch.breakdown
            .locationSimilarity >=
        MIN_LOCATION_SIMILARITY;

    const passesDescriptionRequirement =
        strongestMatch.breakdown
            .descriptionSimilarity >=
        MIN_DESCRIPTION_SIMILARITY;

    const possibleDuplicate =
        passesFinalThreshold &&
        passesLocationRequirement &&
        passesDescriptionRequirement;

    return {
        possibleDuplicate,

        matchedReportId: possibleDuplicate
            ? strongestMatch.canonicalReportId
            : null,

        /**
         * Store the strongest score even when it is
         * below the duplicate threshold.
         */
        duplicateScore:
            strongestMatch.score,

        threshold:
            DUPLICATE_THRESHOLD,

        evaluatedCandidates:
            candidates.length,

        breakdown:
            strongestMatch.breakdown,
    };
};