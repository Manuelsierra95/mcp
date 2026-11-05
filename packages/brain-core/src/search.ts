import type { Concept } from "./types.ts"

/**
 * One search result.
 */
export interface SearchHit {
  readonly path: string
  readonly title: string
  readonly description: string
  readonly type: string
  readonly tags: readonly string[]
  /** Where the match was found. */
  readonly matchedIn: "title" | "description" | "tags" | "body"
  readonly score: number
}

export interface SearchOptions {
  readonly types?: readonly string[]
  readonly tags?: readonly string[]
  readonly limit?: number
}

/**
 * Normalizes a string for comparison: lowercase, without accents.
 *
 * @remarks
 * A developer types "arquitectura" and does not type the accent. The
 * comparison should not be the thing that makes them give up.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/gu, "")
}

/**
 * Searches the bundle.
 *
 * @remarks
 * The ranking is deliberate: a title match beats a body match, because the
 * title is what the concept is about and the body is where it explains it.
 *
 * The result carries only frontmatter and the description, never the body:
 * that is the progressive disclosure the format is built around. Reading
 * the full concept is a second, explicit step.
 */
export function search(
  concepts: readonly Concept[],
  query: string,
  options: SearchOptions = {},
): SearchHit[] {
  const needle = normalize(query.trim())
  const limit = options.limit ?? 20
  const hits: SearchHit[] = []

  for (const concept of concepts) {
    const type = concept.frontmatter.type
    if (options.types !== undefined && !options.types.includes(type)) {
      continue
    }

    const tags = concept.frontmatter.tags ?? []
    if (
      options.tags !== undefined &&
      !options.tags.every((tag) => tags.includes(tag))
    ) {
      continue
    }

    const title = concept.frontmatter.title ?? concept.path
    const description = concept.frontmatter.description ?? ""

    const match = scoreConcept(concept, title, description, tags, needle)
    if (match === null) {
      continue
    }

    hits.push({
      path: concept.path,
      title,
      description,
      type,
      tags,
      matchedIn: match.matchedIn,
      score: match.score,
    })
  }

  return hits
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .slice(0, limit)
}

/**
 * Scores one concept against the query.
 */
function scoreConcept(
  concept: Concept,
  title: string,
  description: string,
  tags: readonly string[],
  needle: string,
): { matchedIn: SearchHit["matchedIn"]; score: number } | null {
  if (needle === "") {
    return { matchedIn: "title", score: 0 }
  }

  const normalizedTitle = normalize(title)
  if (normalizedTitle.includes(needle)) {
    // An exact title is the best possible answer.
    return {
      matchedIn: "title",
      score: normalizedTitle === needle ? 100 : 60,
    }
  }

  const normalizedDescription = normalize(description)
  if (normalizedDescription.includes(needle)) {
    return { matchedIn: "description", score: 40 }
  }

  const normalizedTags = tags.map(normalize)
  if (normalizedTags.some((tag) => tag.includes(needle))) {
    return { matchedIn: "tags", score: 30 }
  }

  if (normalize(concept.body).includes(needle)) {
    return { matchedIn: "body", score: 10 }
  }

  return null
}
