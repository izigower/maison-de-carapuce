'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CardPlaceholder from '@/components/CardPlaceholder';
import { p, VARIANT_COLORS } from '@/lib/palette';
import { PAGE_SIZE, toQueryString, hasActiveFilters } from '@/lib/searchParams';
import type { Card, CatalogueFacets, SearchParamsShape } from '@/types';

const VARIANTS = ['wave', 'drop', 'shell', 'ripple', 'depth', 'current'] as const;

const LANG_LABELS: Record<string, string> = {
  FR: 'Français', EN: 'English', JP: '日本語', DE: 'Deutsch',
  IT: 'Italiano', ES: 'Español', KR: '한국어', PT: 'Português',
  ZH: '中文', ID: 'Indonesia', NL: 'Nederlands', PL: 'Polski', TH: 'ไทย',
};

const SORT_LABELS: Record<SearchParamsShape['sort'], string> = {
  year_asc: 'Chronologique',
  year_desc: 'Plus récentes',
  set_asc: 'Par set (A–Z)',
};

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '7px 13px',
    fontSize: 12,
    fontFamily: 'inherit',
    border: `1px solid ${active ? p.ink : p.rule}`,
    borderColor: active ? p.ink : 'rgba(26,31,44,0.22)',
    background: active ? p.ink : 'transparent',
    color: active ? p.bg : p.ink,
    cursor: 'pointer',
    letterSpacing: 0.3,
    whiteSpace: 'nowrap',
    transition: 'background 120ms, color 120ms, border-color 120ms',
  };
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: 2.4,
  textTransform: 'uppercase',
  color: p.inkSoft,
  marginBottom: 10,
};

export default function CatalogueClient({
  cards,
  total,
  params,
  facets,
  degraded,
}: {
  cards: Card[];
  total: number;
  params: SearchParamsShape;
  facets: CatalogueFacets;
  /** true = migration 002 absente, recherche calculée en JS (cf. searchFallback). */
  degraded: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Le champ texte est piloté localement pour rester fluide ; l'URL suit
  // après un court délai (la recherche s'exécute côté serveur).
  const [draft, setDraft] = useState(params.q);
  const lastPushed = useRef(params.q);

  const navigate = useCallback((next: SearchParamsShape) => {
    const qs = toQueryString(next);
    startTransition(() => router.push(qs ? `/catalogue?${qs}` : '/catalogue', { scroll: false }));
  }, [router]);

  // L'URL peut changer sans passer par l'input (retour arrière, reset).
  useEffect(() => {
    if (params.q !== lastPushed.current) {
      lastPushed.current = params.q;
      setDraft(params.q);
    }
  }, [params.q]);

  useEffect(() => {
    if (draft === lastPushed.current) return;
    const t = setTimeout(() => {
      lastPushed.current = draft;
      navigate({ ...params, q: draft, page: 1 });
    }, 280);
    return () => clearTimeout(t);
  }, [draft, params, navigate]);

  const toggle = (key: 'langs' | 'variants', value: string) => {
    const set = new Set(params[key]);
    if (set.has(value)) set.delete(value); else set.add(value);
    navigate({ ...params, [key]: [...set], page: 1 });
  };

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const active = hasActiveFilters(params);

  const shownRange = useMemo(() => {
    if (total === 0) return null;
    const start = (params.page - 1) * PAGE_SIZE + 1;
    return { start, end: Math.min(start + cards.length - 1, total) };
  }, [params.page, cards.length, total]);

  return (
    <main style={{ padding: '60px 56px 100px' }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        marginBottom: 40, gap: 24, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: p.brass, marginBottom: 12 }}>
            L&apos;archive complète
          </div>
          <h1 style={{
            fontFamily: 'var(--font-playfair), Georgia, serif',
            fontSize: 56, fontWeight: 400, letterSpacing: -1,
          }}>
            Catalogue
          </h1>
        </div>
        <div style={{ fontSize: 13, color: p.inkSoft, textAlign: 'right', opacity: isPending ? 0.45 : 1, transition: 'opacity 150ms' }}>
          {shownRange
            ? <>{shownRange.start}–{shownRange.end} sur <strong style={{ color: p.ink }}>{total}</strong> carte{total !== 1 ? 's' : ''}</>
            : 'Aucun résultat'}
          <div style={{ fontSize: 11, marginTop: 4 }}>
            {facets.total} référencées · {facets.owned} en collection
          </div>
        </div>
      </div>

      {degraded && (
        <div style={{
          padding: '12px 16px', border: `1px solid ${p.brass}`, color: p.brass,
          marginBottom: 28, fontSize: 12, letterSpacing: 0.2,
        }}>
          Mode dégradé : recherche calculée côté serveur en mémoire.
          Applique <code>002_search_moderation.sql</code> sur Supabase pour activer
          la recherche Postgres et la modération.
        </div>
      )}

      {/* ---------- Recherche ---------- */}
      <div style={{ borderBottom: `1px solid rgba(26,31,44,0.15)`, paddingBottom: 26, marginBottom: 26 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Set, année, illustrateur, numéro, rareté, variante…"
            aria-label="Rechercher une carte"
            style={{
              flex: 1, minWidth: 260, padding: '12px 0',
              border: 'none', borderBottom: `1px solid ${p.rule}`,
              background: 'transparent', fontSize: 16, outline: 'none',
              color: p.ink, fontFamily: 'inherit',
            }}
          />
          {draft && (
            <button onClick={() => setDraft('')} style={{ ...chipStyle(false), border: 'none', color: p.inkSoft }}>
              effacer ✕
            </button>
          )}
          <select
            value={params.sort}
            onChange={e => navigate({ ...params, sort: e.target.value as SearchParamsShape['sort'], page: 1 })}
            aria-label="Trier"
            style={{
              padding: '8px 10px', fontSize: 12, fontFamily: 'inherit',
              border: `1px solid rgba(26,31,44,0.22)`, background: 'transparent',
              color: p.ink, cursor: 'pointer',
            }}
          >
            {Object.entries(SORT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* ---------- Filtres ---------- */}
      <div style={{ display: 'grid', gap: 22, marginBottom: 32 }}>
        {facets.langs.length > 0 && (
          <div>
            <div style={labelStyle}>Langue</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {facets.langs.map(f => (
                <button key={f.value} onClick={() => toggle('langs', f.value)}
                  style={chipStyle(params.langs.includes(f.value))}>
                  {LANG_LABELS[f.value] ?? f.value}
                  <span style={{ opacity: 0.55, marginLeft: 6 }}>{f.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {facets.variants.length > 0 && (
          <div>
            <div style={labelStyle}>Variante</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {facets.variants.map(f => {
                const on = params.variants.includes(f.value);
                const accent = VARIANT_COLORS[f.value];
                return (
                  <button key={f.value} onClick={() => toggle('variants', f.value)}
                    style={{
                      ...chipStyle(on),
                      ...(accent && !on ? { borderColor: accent, color: accent } : {}),
                      ...(accent && on ? { background: accent, borderColor: accent, color: p.bg } : {}),
                    }}>
                    {f.value}
                    <span style={{ opacity: 0.55, marginLeft: 6 }}>{f.count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
          <div>
            <div style={labelStyle}>Collection</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {([
                [null, 'Toutes'],
                [true, 'Possédées'],
                [false, 'Manquantes'],
              ] as const).map(([val, label]) => (
                <button key={label} onClick={() => navigate({ ...params, owned: val, page: 1 })}
                  style={chipStyle(params.owned === val)}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {facets.years.min !== null && facets.years.max !== null && (
            <div>
              <div style={labelStyle}>Période</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
                <input type="number" inputMode="numeric"
                  value={params.yearMin ?? ''} placeholder={String(facets.years.min)}
                  aria-label="Année minimum"
                  onChange={e => navigate({ ...params, yearMin: e.target.value ? Number(e.target.value) : null, page: 1 })}
                  style={{
                    width: 80, padding: '7px 8px', fontFamily: 'inherit', fontSize: 13,
                    border: `1px solid rgba(26,31,44,0.22)`, background: 'transparent', color: p.ink,
                  }} />
                <span style={{ color: p.inkSoft }}>→</span>
                <input type="number" inputMode="numeric"
                  value={params.yearMax ?? ''} placeholder={String(facets.years.max)}
                  aria-label="Année maximum"
                  onChange={e => navigate({ ...params, yearMax: e.target.value ? Number(e.target.value) : null, page: 1 })}
                  style={{
                    width: 80, padding: '7px 8px', fontFamily: 'inherit', fontSize: 13,
                    border: `1px solid rgba(26,31,44,0.22)`, background: 'transparent', color: p.ink,
                  }} />
              </div>
            </div>
          )}

          {facets.missing_image > 0 && (
            <div>
              <div style={labelStyle}>Appel à contribution</div>
              <button
                onClick={() => navigate({ ...params, missingImage: params.missingImage ? null : true, page: 1 })}
                style={{
                  ...chipStyle(Boolean(params.missingImage)),
                  ...(params.missingImage
                    ? { background: p.brass, borderColor: p.brass, color: p.bg }
                    : { borderColor: p.brass, color: p.brass }),
                }}>
                Sans visuel
                <span style={{ opacity: 0.65, marginLeft: 6 }}>{facets.missing_image}</span>
              </button>
            </div>
          )}

          {active && (
            <div style={{ alignSelf: 'flex-end' }}>
              <button
                onClick={() => { lastPushed.current = ''; setDraft(''); navigate({
                  q: '', langs: [], variants: [], owned: null,
                  yearMin: null, yearMax: null, missingImage: null,
                  sort: params.sort, page: 1,
                }); }}
                style={{ ...chipStyle(false), borderColor: p.brass, color: p.brass }}>
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ---------- Résultats ---------- */}
      {cards.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '90px 0', color: p.inkSoft }}>
          <div style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 30, marginBottom: 12, color: p.ink }}>
            Aucune carte trouvée
          </div>
          <div style={{ fontSize: 14, maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
            Cette carte manque peut-être vraiment à l&apos;archive.{' '}
            <Link href="/contribuer" style={{ color: p.water }}>Recensez-la</Link> — c&apos;est exactement
            comme ça que la Maison s&apos;agrandit.
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: 36, rowGap: 56,
          opacity: isPending ? 0.5 : 1,
          transition: 'opacity 150ms',
        }}>
          {cards.map((card, i) => (
            <Link key={card.id} href={`/carte/${card.id}`}
              style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ aspectRatio: '3/4', marginBottom: 14, position: 'relative' }}>
                <CardPlaceholder card={card} variant={VARIANTS[i % 6]} owned={card.is_owned} />
              </div>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: p.brass }}>
                {card.lang} · {card.year ?? 'année inconnue'}
              </div>
              <div style={{
                fontFamily: 'var(--font-playfair), Georgia, serif',
                fontSize: 17, marginTop: 4, letterSpacing: -0.2,
              }}>
                {card.set_name}
              </div>
              <div style={{ color: p.inkSoft, fontSize: 12, marginTop: 4 }}>
                {card.variant} · {card.card_number}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ---------- Pagination ---------- */}
      {pageCount > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          gap: 14, marginTop: 70, fontSize: 13,
        }}>
          <button
            disabled={params.page <= 1}
            onClick={() => navigate({ ...params, page: params.page - 1 })}
            style={{ ...chipStyle(false), opacity: params.page <= 1 ? 0.3 : 1, cursor: params.page <= 1 ? 'default' : 'pointer' }}>
            ← Précédent
          </button>
          <span style={{ color: p.inkSoft, letterSpacing: 1 }}>
            Page {params.page} / {pageCount}
          </span>
          <button
            disabled={params.page >= pageCount}
            onClick={() => navigate({ ...params, page: params.page + 1 })}
            style={{ ...chipStyle(false), opacity: params.page >= pageCount ? 0.3 : 1, cursor: params.page >= pageCount ? 'default' : 'pointer' }}>
            Suivant →
          </button>
        </div>
      )}
    </main>
  );
}
