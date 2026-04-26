import { p } from '@/lib/palette';

const COLUMNS = [
  { t: 'Archive', l: ['Catalogue', 'Sets', 'Langues', 'Stickers Topps'] },
  { t: 'Communauté', l: ['Contribuer', 'Donateurs', 'Conservateurs', 'Forum'] },
  { t: 'Maison', l: ['Manifeste', 'Adresse postale', 'Contact', 'Mentions légales'] },
];

export default function Footer() {
  return (
    <footer style={{
      padding: '60px 56px 50px',
      borderTop: `1px solid ${p.rule}`,
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr 1fr',
      gap: 50,
      fontSize: 13,
    }}>
      <div>
        <div style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 18 }}>
          La Maison de Carapuce
        </div>
        <p style={{ color: p.inkSoft, marginTop: 12, lineHeight: 1.6 }}>
          Archive non-officielle, à but non-lucratif. Site de fans, par des fans.
          Pokémon, Carapuce et toutes les marques associées appartiennent à leurs ayants droit respectifs.
        </p>
      </div>
      {COLUMNS.map(col => (
        <div key={col.t}>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: p.brass, marginBottom: 14 }}>
            {col.t}
          </div>
          {col.l.map(x => (
            <div key={x} style={{ marginTop: 8, color: p.ink }}>{x}</div>
          ))}
        </div>
      ))}
    </footer>
  );
}
