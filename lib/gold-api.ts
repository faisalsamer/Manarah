// ─────────────────────────────────────────────────────────────
// GOLD API CLIENT
// Fetches gold and silver prices from goldapi.io
// Prices are returned per troy ounce — we convert to per gram
// 1 troy ounce = 31.1035 grams
// ─────────────────────────────────────────────────────────────

import { NisabPrices, MetalPrice } from '@/types/zakat'
import { NISAB } from '@/lib/zakat/constants'
import { toRiyadhDateString } from '@/utils/date'
import { prisma } from '@/lib/prisma'

const TROY_OUNCE_IN_GRAMS = 31.1035
const DEFAULT_GOLD_API_BASE_URL = 'https://www.goldapi.io/api'
const DEFAULT_FALLBACK_GOLD_PRICE_PER_GRAM_SAR = 264.1176
const DEFAULT_FALLBACK_SILVER_PRICE_PER_GRAM_SAR = 3.1765

// Fallback responses are cached in-memory. Live API responses intentionally
// refresh per request so the UI does not get stuck on old fallback values.
const priceCache = new Map<string, NisabPrices>()
let historicalGoldApiDisabledReason: string | null = null
let warnedAboutBaseUrl = false

type CachedNisabRow = {
  gold_price_per_gram: unknown
  silver_price_per_gram: unknown
  gold_nisab_value_sar: unknown
  silver_nisab_value_sar: unknown
  fetched_at: Date
}

type GoldApiResponse = {
  price?: unknown
  price_gram?: unknown
  price_gram_24k?: unknown
  price_gram_24K?: unknown
}

function getNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback

  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function buildFallbackNisabPrices(priceDate: string): NisabPrices {
  const fetchedAt = new Date().toISOString()
  const goldPricePerGram = getNumberEnv(
    'NISAB_FALLBACK_GOLD_PRICE_PER_GRAM_SAR',
    DEFAULT_FALLBACK_GOLD_PRICE_PER_GRAM_SAR
  )
  const silverPricePerGram = getNumberEnv(
    'NISAB_FALLBACK_SILVER_PRICE_PER_GRAM_SAR',
    DEFAULT_FALLBACK_SILVER_PRICE_PER_GRAM_SAR
  )

  return {
    gold: {
      pricePerGramSAR: parseFloat(goldPricePerGram.toFixed(4)),
      fetchedAt,
      source: 'fallback',
    },
    silver: {
      pricePerGramSAR: parseFloat(silverPricePerGram.toFixed(4)),
      fetchedAt,
      source: 'fallback',
    },
    goldNisabValueSAR: parseFloat((goldPricePerGram * NISAB.GOLD_GRAMS).toFixed(2)),
    silverNisabValueSAR: parseFloat((silverPricePerGram * NISAB.SILVER_GRAMS).toFixed(2)),
    priceDate,
  }
}

function toPositiveNumber(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function formatGoldApiDate(dateStr: string): string {
  return dateStr.replaceAll('-', '')
}

function getGoldApiBaseUrl(): string {
  const raw = process.env.GOLD_API_BASE_URL?.trim()
  if (!raw) return DEFAULT_GOLD_API_BASE_URL

  try {
    const url = new URL(raw)

    if (url.hostname === 'gold-api.org' || url.hostname === 'www.gold-api.org') {
      if (!warnedAboutBaseUrl) {
        console.warn('[GoldAPI] GOLD_API_BASE_URL points to the marketing site; using https://www.goldapi.io/api instead.')
        warnedAboutBaseUrl = true
      }
      return DEFAULT_GOLD_API_BASE_URL
    }

    if (
      (url.hostname === 'goldapi.io' || url.hostname === 'www.goldapi.io') &&
      (url.pathname === '' || url.pathname === '/')
    ) {
      url.pathname = '/api'
    }

    return `${url.origin}${url.pathname.replace(/\/+$/, '')}`
  } catch {
    if (!warnedAboutBaseUrl) {
      console.warn('[GoldAPI] GOLD_API_BASE_URL is invalid; using https://www.goldapi.io/api instead.')
      warnedAboutBaseUrl = true
    }
    return DEFAULT_GOLD_API_BASE_URL
  }
}

function mapCachedPrices(cached: CachedNisabRow, priceDate: string): NisabPrices {
  return {
    gold: {
      pricePerGramSAR: Number(cached.gold_price_per_gram),
      fetchedAt: cached.fetched_at.toISOString(),
      source: 'cache',
    },
    silver: {
      pricePerGramSAR: Number(cached.silver_price_per_gram),
      fetchedAt: cached.fetched_at.toISOString(),
      source: 'cache',
    },
    goldNisabValueSAR: Number(cached.gold_nisab_value_sar),
    silverNisabValueSAR: Number(cached.silver_nisab_value_sar),
    priceDate,
  }
}

function isFallbackPriceRow(cached: CachedNisabRow): boolean {
  const gold = Number(cached.gold_price_per_gram)
  const silver = Number(cached.silver_price_per_gram)

  return (
    Math.abs(gold - DEFAULT_FALLBACK_GOLD_PRICE_PER_GRAM_SAR) < 0.0001 &&
    Math.abs(silver - DEFAULT_FALLBACK_SILVER_PRICE_PER_GRAM_SAR) < 0.0001
  )
}

async function fetchMetalPriceSAR(
  metal: 'XAU' | 'XAG',
  priceDate?: string
): Promise<MetalPrice> {
  const apiKey = process.env.GOLD_API_KEY?.trim()
  const baseUrl = getGoldApiBaseUrl()

  if (!apiKey) {
    throw new Error('GOLD_API_KEY is not set in environment variables')
  }

  const endpoint = priceDate
    ? `${baseUrl}/${metal}/SAR/${formatGoldApiDate(priceDate)}`
    : `${baseUrl}/${metal}/SAR`

  const res = await fetch(endpoint, {
    headers: { 'x-access-token': apiKey, 'Content-Type': 'application/json' },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`GoldAPI error: ${res.status} ${res.statusText} for metal ${metal}`)
  }

  const responseText = await res.text()
  const contentType = res.headers.get('content-type') ?? ''
  const trimmedResponse = responseText.trim()

  if (
    !contentType.includes('application/json') &&
    !trimmedResponse.startsWith('{') &&
    !trimmedResponse.startsWith('[')
  ) {
    throw new Error(`GoldAPI returned non-JSON response from ${new URL(endpoint).pathname}`)
  }

  let data: GoldApiResponse
  try {
    data = JSON.parse(responseText) as GoldApiResponse
  } catch {
    throw new Error(`GoldAPI returned invalid JSON from ${new URL(endpoint).pathname}`)
  }

  const pricePerGram =
    toPositiveNumber(data.price_gram_24k) ??
    toPositiveNumber(data.price_gram_24K) ??
    toPositiveNumber(data.price_gram) ??
    (() => {
      const ouncePrice = toPositiveNumber(data.price)
      return ouncePrice ? ouncePrice / TROY_OUNCE_IN_GRAMS : null
    })()

  if (!pricePerGram) {
    throw new Error(`GoldAPI returned invalid price for ${metal}: ${data.price}`)
  }

  return {
    pricePerGramSAR: parseFloat(pricePerGram.toFixed(4)),
    fetchedAt: new Date().toISOString(),
    source: 'api',
  }
}

async function getCachedOrFallbackPrices(priceDate: string): Promise<NisabPrices> {
  const latestCached = await prisma.nisab_price_history.findFirst({
    orderBy: { price_date: 'desc' },
  })

  return latestCached
    ? mapCachedPrices(latestCached, priceDate)
    : buildFallbackNisabPrices(priceDate)
}

async function fetchNisabPricesFromGoldApi(priceDate: string): Promise<NisabPrices> {
  const todayRiyadh = toRiyadhDateString(new Date())
  const shouldUseHistoricalEndpoint = priceDate < todayRiyadh

  const [gold, silver] = await Promise.all([
    fetchMetalPriceSAR('XAU', shouldUseHistoricalEndpoint ? priceDate : undefined),
    fetchMetalPriceSAR('XAG', shouldUseHistoricalEndpoint ? priceDate : undefined),
  ])

  const goldNisabValueSAR = parseFloat((gold.pricePerGramSAR * NISAB.GOLD_GRAMS).toFixed(2))
  const silverNisabValueSAR = parseFloat((silver.pricePerGramSAR * NISAB.SILVER_GRAMS).toFixed(2))

  return {
    gold,
    silver,
    goldNisabValueSAR,
    silverNisabValueSAR,
    priceDate,
  }
}

async function saveNisabPrices(prices: NisabPrices): Promise<void> {
  await prisma.nisab_price_history.upsert({
    where: { price_date: new Date(prices.priceDate) },
    create: {
      price_date: new Date(prices.priceDate),
      gold_price_per_gram: prices.gold.pricePerGramSAR,
      gold_nisab_grams: NISAB.GOLD_GRAMS,
      gold_nisab_value_sar: prices.goldNisabValueSAR,
      silver_price_per_gram: prices.silver.pricePerGramSAR,
      silver_nisab_grams: NISAB.SILVER_GRAMS,
      silver_nisab_value_sar: prices.silverNisabValueSAR,
      source: 'goldapi',
      raw_response: {
        gold: {
          pricePerGramSAR: prices.gold.pricePerGramSAR,
          fetchedAt: prices.gold.fetchedAt,
          source: prices.gold.source,
        },
        silver: {
          pricePerGramSAR: prices.silver.pricePerGramSAR,
          fetchedAt: prices.silver.fetchedAt,
          source: prices.silver.source,
        },
      },
    },
    update: {
      gold_price_per_gram: prices.gold.pricePerGramSAR,
      gold_nisab_value_sar: prices.goldNisabValueSAR,
      silver_price_per_gram: prices.silver.pricePerGramSAR,
      silver_nisab_value_sar: prices.silverNisabValueSAR,
      source: 'goldapi',
      raw_response: {
        gold: {
          pricePerGramSAR: prices.gold.pricePerGramSAR,
          fetchedAt: prices.gold.fetchedAt,
          source: prices.gold.source,
        },
        silver: {
          pricePerGramSAR: prices.silver.pricePerGramSAR,
          fetchedAt: prices.silver.fetchedAt,
          source: prices.silver.source,
        },
      },
      fetched_at: new Date(),
    },
  })
}

export async function getTodayNisabPrices(): Promise<NisabPrices> {
  const todayRiyadh = toRiyadhDateString(new Date())
  const hasApiKey = Boolean(process.env.GOLD_API_KEY?.trim())
  const cachedMemory = priceCache.get(todayRiyadh)

  if (cachedMemory && !hasApiKey) {
    return cachedMemory
  }

  if (!hasApiKey) {
    console.warn('[getTodayNisabPrices] GOLD_API_KEY is missing; using cached or fallback nisab prices.')

    const prices = await getCachedOrFallbackPrices(todayRiyadh)
    priceCache.set(todayRiyadh, prices)
    return prices
  }

  try {
    const prices = await fetchNisabPricesFromGoldApi(todayRiyadh)
    await saveNisabPrices(prices)
    priceCache.set(todayRiyadh, prices)
    return prices
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[getTodayNisabPrices] GoldAPI unavailable; using cached or fallback nisab prices. ${message}`)

    const prices = await getCachedOrFallbackPrices(todayRiyadh)
    priceCache.set(todayRiyadh, prices)
    return prices
  }
}

export async function getNisabPriceForDate(dateStr: string): Promise<NisabPrices> {
  const todayRiyadh = toRiyadhDateString(new Date())
  const hasApiKey = Boolean(process.env.GOLD_API_KEY?.trim())

  if (dateStr >= todayRiyadh) {
    return getTodayNisabPrices()
  }

  const exact = await prisma.nisab_price_history.findUnique({
    where: { price_date: new Date(dateStr) },
  })

  if (exact && (!hasApiKey || !isFallbackPriceRow(exact))) {
    return mapCachedPrices(exact, dateStr)
  }

  if (hasApiKey && !historicalGoldApiDisabledReason) {
    try {
      const prices = await fetchNisabPricesFromGoldApi(dateStr)
      await saveNisabPrices(prices)
      return prices
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      historicalGoldApiDisabledReason = message
      console.warn(`[getNisabPriceForDate] GoldAPI historical price unavailable; using cached/fallback prices for historical dates. ${message}`)

      if (exact) {
        return mapCachedPrices(exact, dateStr)
      }
    }
  }

  const closest = await prisma.nisab_price_history.findFirst({
    where: { price_date: { lte: new Date(dateStr) } },
    orderBy: { price_date: 'desc' },
  })

  if (!closest) return buildFallbackNisabPrices(dateStr)

  return mapCachedPrices(closest, dateStr)
}
