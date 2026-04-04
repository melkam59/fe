export type BranchOption = {
  resortId: string
  name: string
  location: string
  selectionLabel: string
  aliases: string[]
}

const branchCatalog: BranchOption[] = [
  {
    resortId: "kuriftu-entoto",
    name: "Kuriftu Entoto Adventure Park",
    location: "Addis Ababa, Ethiopia",
    selectionLabel: "Kuriftu Entoto Adventure Park in Addis Ababa, Ethiopia",
    aliases: [
      "kuriftu entoto",
      "kuriftu entoto adventure park",
      "kuriftu entoto adventure park in addis ababa",
      "kuriftu entoto adventure park in addis ababa ethiopia",
      "entoto",
      "entoto adventure park",
    ],
  },
  {
    resortId: "kuriftu-water-park-adama",
    name: "Kuriftu Water Park",
    location: "Adama, Ethiopia",
    selectionLabel: "Kuriftu Water Park in Adama, Ethiopia",
    aliases: [
      "kuriftu water park",
      "kuriftu water park in adama",
      "water park",
      "adama water park",
    ],
  },
  {
    resortId: "kuriftu-bishoftu",
    name: "Kuriftu Bishoftu",
    location: "Bishoftu, Ethiopia",
    selectionLabel: "Kuriftu Bishoftu in Bishoftu, Ethiopia",
    aliases: [
      "kuriftu bishoftu",
      "bishoftu",
      "bishoftu resort",
    ],
  },
  {
    resortId: "kuriftu-awash",
    name: "Kuriftu Awash",
    location: "Awash, Ethiopia",
    selectionLabel: "Kuriftu Awash in Awash, Ethiopia",
    aliases: [
      "kuriftu awash",
      "awash",
      "awash falls",
    ],
  },
  {
    resortId: "kuriftu-lake-tana",
    name: "Kuriftu Lake Tana",
    location: "Lake Tana, Ethiopia",
    selectionLabel: "Kuriftu Lake Tana in Lake Tana, Ethiopia",
    aliases: [
      "kuriftu lake tana",
      "lake tana",
      "lake tana resort",
    ],
  },
  {
    resortId: "kuriftu-african-village",
    name: "Kuriftu African Village",
    location: "Shaggar City, Ethiopia",
    selectionLabel: "Kuriftu African Village in Shaggar City, Ethiopia",
    aliases: [
      "kuriftu african village",
      "african village",
      "shaggar city",
    ],
  },
]

const branchListPattern =
  /\b(branch|branches|resort|resorts|destination|destinations|location|locations)\b/i
const availabilityIntentPattern =
  /\b(book|booking|reserve|reservation|room|rooms|availability|available|check[\s-]?in|stay|night|nights)\b/i
const standaloneActionPattern =
  /\b(book|booking|reserve|reservation|check[\s-]?in|night|nights|adult|adults|child|children|guest|guests|available|availability)\b/i

function normalizeBranchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function listAvailableBranches() {
  return branchCatalog
}

export function getBranchLabel(resortId: string | null | undefined) {
  if (!resortId) {
    return null
  }

  const matchingBranch = branchCatalog.find((branch) => branch.resortId === resortId)
  return matchingBranch?.name ?? null
}

export function looksLikeBranchListRequest(content: string) {
  const normalized = normalizeBranchText(content)

  if (!normalized) {
    return false
  }

  return (
    branchListPattern.test(normalized) &&
    /\b(what|which|show|list|available|currently|have|offer)\b/i.test(normalized)
  )
}

export function looksLikeBookingRequestWithoutBranch(content: string) {
  const normalized = normalizeBranchText(content)

  if (!normalized) {
    return false
  }

  return availabilityIntentPattern.test(normalized) && !matchBranchFromMessage(content)
}

export function matchBranchFromMessage(content: string) {
  const normalizedContent = normalizeBranchText(content)

  if (!normalizedContent) {
    return null
  }

  let bestMatch: { branch: BranchOption; score: number } | null = null

  for (const branch of branchCatalog) {
    for (const alias of [branch.selectionLabel, branch.name, ...branch.aliases]) {
      const normalizedAlias = normalizeBranchText(alias)

      if (!normalizedAlias) {
        continue
      }

      const matched =
        normalizedContent === normalizedAlias ||
        normalizedContent.includes(normalizedAlias) ||
        (normalizedContent.length >= 10 &&
          normalizedAlias.includes(normalizedContent))

      if (!matched) {
        continue
      }

      if (!bestMatch || normalizedAlias.length > bestMatch.score) {
        bestMatch = {
          branch,
          score: normalizedAlias.length,
        }
      }
    }
  }

  return bestMatch?.branch ?? null
}

export function isStandaloneBranchSelection(content: string) {
  const normalized = normalizeBranchText(content)

  if (!normalized || standaloneActionPattern.test(normalized)) {
    return false
  }

  return matchBranchFromMessage(content) !== null
}
