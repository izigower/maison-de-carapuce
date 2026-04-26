// Direction 1 — ÉDITORIAL MUSÉE
// Catalogue d'art moderne. Beaucoup d'espace, typo soignée (sérif déplacé +
// sans-serif neutre). Palette: crème museum + bleu profond Carapuce + accent
// laiton. Hero immense, grille generous, légendes type cartel.

const MuseumPalette = {
  bg: "#f3efe7",
  ink: "#1a1f2c",
  inkSoft: "#5a5e6a",
  rule: "#1a1f2c",
  brass: "#a07a3a",
  water: "#2a4a6e",
  card: "#fbf8f1",
};

function MuseumDirection() {
  const [route, setRoute] = React.useState("home"); // home | catalogue | contribute | donateurs | card-detail
  const [selectedCard, setSelectedCard] = React.useState(null);
  const [filter, setFilter] = React.useState({ lang: "ALL", q: "", showOwned: "all" });
  const [stats, setStats] = React.useState({ cards: 0, langs: 0, contrib: 0 });

  // Animated counter on home
  React.useEffect(() => {
    if (route !== "home") return;
    const target = window.CARAPUCE_STATS;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 1400);
      const eased = 1 - Math.pow(1 - t, 3);
      setStats({
        cards: Math.round(target.totalCards * eased),
        langs: Math.round(target.totalLangs * eased),
        contrib: Math.round(target.contributors * eased),
      });
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [route]);

  return (
    <div style={{
      width: "100%", height: "100%", overflow: "auto",
      background: MuseumPalette.bg, color: MuseumPalette.ink,
      fontFamily: '"Tiempos Text", "Source Serif Pro", Georgia, serif',
      fontSize: 15, lineHeight: 1.55,
    }}>
      <MuseumNav route={route} setRoute={setRoute} />
      {route === "home" && <MuseumHome stats={stats} setRoute={setRoute} setSelectedCard={(c) => { setSelectedCard(c); setRoute("card-detail"); }} />}
      {route === "catalogue" && <MuseumCatalogue filter={filter} setFilter={setFilter} setSelectedCard={(c) => { setSelectedCard(c); setRoute("card-detail"); }} />}
      {route === "contribute" && <MuseumContribute setRoute={setRoute} setSelectedCard={(c) => { setSelectedCard(c); setRoute("card-detail"); }} />}
      {route === "donateurs" && <MuseumDonateurs />}
      {route === "card-detail" && selectedCard && <MuseumCardDetail card={selectedCard} onBack={() => setRoute("catalogue")} />}
      <MuseumFooter />
    </div>
  );
}

function MuseumNav({ route, setRoute }) {
  const items = [
    { id: "home", label: "Accueil" },
    { id: "catalogue", label: "Catalogue" },
    { id: "donateurs", label: "Donateurs" },
    { id: "contribute", label: "Contribuer" },
  ];
  return (
    <header style={{
      borderBottom: `1px solid ${MuseumPalette.rule}`,
      padding: "22px 56px", display: "flex", alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, background: MuseumPalette.bg, zIndex: 10,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          border: `1.5px solid ${MuseumPalette.ink}`,
          position: "relative",
        }}>
          <div style={{ position: "absolute", inset: 6, borderRadius: "50%", background: MuseumPalette.water }} />
        </div>
        <div>
          <div style={{ fontFamily: '"Tiempos Headline", "Playfair Display", Georgia, serif', fontSize: 20, fontWeight: 500, letterSpacing: -0.3 }}>
            La Maison de Carapuce
          </div>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: MuseumPalette.inkSoft, marginTop: 1 }}>
            Catalogue communautaire · Est. 1996
          </div>
        </div>
      </div>
      <nav style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {items.map(i => (
          <button key={i.id} onClick={() => setRoute(i.id)} style={{
            background: "none", border: "none",
            fontFamily: "inherit", fontSize: 13,
            padding: "8px 16px", cursor: "pointer",
            color: route === i.id ? MuseumPalette.ink : MuseumPalette.inkSoft,
            borderBottom: route === i.id ? `1.5px solid ${MuseumPalette.brass}` : "1.5px solid transparent",
            letterSpacing: 0.2,
          }}>{i.label}</button>
        ))}
        <button style={{
          marginLeft: 18, background: MuseumPalette.ink, color: MuseumPalette.bg,
          border: "none", fontFamily: "inherit", fontSize: 12,
          padding: "10px 18px", cursor: "pointer", letterSpacing: 1, textTransform: "uppercase",
        }}>Se connecter</button>
      </nav>
    </header>
  );
}

function MuseumHome({ stats, setRoute, setSelectedCard }) {
  const recent = window.CARAPUCE_CARDS.slice(0, 6);
  return (
    <main>
      {/* HERO */}
      <section style={{ padding: "100px 56px 120px", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 80, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: MuseumPalette.brass, marginBottom: 28 }}>
            № 007 · L'archive
          </div>
          <h1 style={{
            fontFamily: '"Tiempos Headline", "Playfair Display", Georgia, serif',
            fontSize: 88, lineHeight: 0.95, fontWeight: 400, margin: 0,
            letterSpacing: -2,
          }}>
            Toutes les<br />
            <em style={{ fontStyle: "italic", color: MuseumPalette.water }}>cartes Carapuce</em><br />
            jamais imprimées.
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: MuseumPalette.inkSoft, marginTop: 36, maxWidth: 460 }}>
            Une archive vivante, recensée par celles et ceux qui aiment Carapuce
            plus que tout. Toutes les langues, tous les sets, toutes les variantes —
            jusqu'aux stickers Topps et aux promos oubliées.
          </p>
          <div style={{ display: "flex", gap: 14, marginTop: 40 }}>
            <button onClick={() => setRoute("catalogue")} style={museumBtn(true)}>Parcourir le catalogue →</button>
            <button onClick={() => setRoute("contribute")} style={museumBtn(false)}>Contribuer</button>
          </div>
        </div>

        <div style={{ position: "relative", aspectRatio: "3/4" }}>
          <CardPlaceholder large variant="hero" />
          <div style={{
            position: "absolute", bottom: -22, left: -22, padding: "14px 18px",
            background: MuseumPalette.card, border: `1px solid ${MuseumPalette.ink}`,
            fontSize: 11, lineHeight: 1.5, maxWidth: 240,
          }}>
            <div style={{ letterSpacing: 2, textTransform: "uppercase", fontSize: 9, color: MuseumPalette.brass, marginBottom: 6 }}>Cartel №1</div>
            <div style={{ fontFamily: '"Tiempos Headline", Georgia, serif', fontSize: 14 }}>Carapuce, Set de Base</div>
            <div style={{ color: MuseumPalette.inkSoft }}>Wizards of the Coast, 1999<br />Édition 1, Shadowless</div>
          </div>
        </div>
      </section>

      {/* STAT BAND */}
      <section style={{ borderTop: `1px solid ${MuseumPalette.rule}`, borderBottom: `1px solid ${MuseumPalette.rule}`, padding: "44px 56px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 40 }}>
        {[
          { n: stats.cards, l: "cartes recensées" },
          { n: stats.langs, l: "langues couvertes" },
          { n: stats.contrib, l: "contributeurs" },
          { n: 89, l: "items reçus pour la collection" },
        ].map((s, i) => (
          <div key={i} style={{ borderLeft: i === 0 ? "none" : `1px solid ${MuseumPalette.rule}`, paddingLeft: i === 0 ? 0 : 30 }}>
            <div style={{ fontFamily: '"Tiempos Headline", Georgia, serif', fontSize: 56, fontWeight: 400, lineHeight: 1, letterSpacing: -1.5 }}>
              {s.n.toLocaleString("fr-FR")}
            </div>
            <div style={{ fontSize: 12, color: MuseumPalette.inkSoft, marginTop: 10, letterSpacing: 0.3 }}>{s.l}</div>
          </div>
        ))}
      </section>

      {/* RECENT ACQUISITIONS */}
      <section style={{ padding: "100px 56px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 50 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: MuseumPalette.brass, marginBottom: 12 }}>
              Acquisitions récentes
            </div>
            <h2 style={{ fontFamily: '"Tiempos Headline", Georgia, serif', fontSize: 44, fontWeight: 400, margin: 0, letterSpacing: -0.8 }}>
              Ajoutées par la communauté<br />ce mois-ci.
            </h2>
          </div>
          <button onClick={() => setRoute("catalogue")} style={{ ...museumBtn(false), padding: "12px 22px" }}>Tout voir →</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 48, rowGap: 70 }}>
          {recent.map((c, i) => (
            <article key={c.id} onClick={() => { setSelectedCard(c); }} style={{ cursor: "pointer" }}>
              <div style={{ aspectRatio: "3/4", marginBottom: 18 }}>
                <CardPlaceholder card={c} variant={["wave", "drop", "shell", "ripple", "depth", "current"][i % 6]} />
              </div>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: MuseumPalette.brass }}>№ {String(i + 1).padStart(3, "0")}</div>
              <div style={{ fontFamily: '"Tiempos Headline", Georgia, serif', fontSize: 22, marginTop: 6, letterSpacing: -0.3 }}>
                {c.set}
              </div>
              <div style={{ color: MuseumPalette.inkSoft, fontSize: 13, marginTop: 6 }}>
                {c.year} · {c.lang} · {c.variant}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* MANIFEST */}
      <section style={{ padding: "120px 56px", background: MuseumPalette.water, color: MuseumPalette.bg }}>
        <div style={{ maxWidth: 780 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", opacity: 0.7, marginBottom: 28 }}>Manifeste</div>
          <p style={{ fontFamily: '"Tiempos Headline", Georgia, serif', fontSize: 36, lineHeight: 1.25, fontWeight: 400, letterSpacing: -0.5 }}>
            « Une carte n'est pas un objet de spéculation.
            C'est un fragment de notre enfance, une preuve qu'on a aimé
            quelque chose à fond. Cette maison existe pour les ranger
            toutes — même celles que personne n'a vues depuis vingt ans. »
          </p>
          <div style={{ marginTop: 36, fontSize: 13, opacity: 0.8 }}>— L'équipe de la Maison</div>
        </div>
      </section>
    </main>
  );
}

function MuseumCatalogue({ filter, setFilter, setSelectedCard }) {
  const cards = window.CARAPUCE_CARDS.filter(c => {
    if (filter.lang !== "ALL" && c.lang !== filter.lang) return false;
    if (filter.q && !(c.set + c.variant + c.year).toLowerCase().includes(filter.q.toLowerCase())) return false;
    return true;
  });
  return (
    <main style={{ padding: "60px 56px 100px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 40 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: MuseumPalette.brass, marginBottom: 12 }}>
            L'archive complète
          </div>
          <h1 style={{ fontFamily: '"Tiempos Headline", Georgia, serif', fontSize: 56, fontWeight: 400, margin: 0, letterSpacing: -1 }}>
            Catalogue
          </h1>
        </div>
        <div style={{ fontSize: 13, color: MuseumPalette.inkSoft }}>
          {cards.length} cartes affichées sur {window.CARAPUCE_CARDS.length}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 50, paddingBottom: 24, borderBottom: `1px solid ${MuseumPalette.rule}` }}>
        <input
          placeholder="Rechercher un set, une année, une variante…"
          value={filter.q}
          onChange={e => setFilter({ ...filter, q: e.target.value })}
          style={{
            flex: 1, padding: "12px 0", border: "none", borderBottom: `1px solid ${MuseumPalette.rule}`,
            background: "transparent", fontFamily: "inherit", fontSize: 15, outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: 4 }}>
          {window.CARAPUCE_LANGS.slice(0, 6).map(l => (
            <button key={l.code} onClick={() => setFilter({ ...filter, lang: l.code })} style={{
              padding: "8px 14px", fontSize: 12, fontFamily: "inherit",
              border: `1px solid ${filter.lang === l.code ? MuseumPalette.ink : "transparent"}`,
              background: filter.lang === l.code ? MuseumPalette.ink : "transparent",
              color: filter.lang === l.code ? MuseumPalette.bg : MuseumPalette.ink,
              cursor: "pointer", letterSpacing: 0.3,
            }}>{l.label}</button>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 30, fontSize: 11, color: MuseumPalette.inkSoft, flexWrap: "wrap" }}>
        <span style={{ letterSpacing: 2, textTransform: "uppercase" }}>Légende des étiquettes :</span>
        <LegendDot color="#1a1f2c" label="Langue" />
        <LegendDot color="#a07a3a" label="Édition 1" />
        <LegendDot color="#5a5e6a" label="Shadowless / Unlimited" />
        <LegendDot color="#7a4a8a" label="Reverse" />
        <LegendDot color="#a8485a" label="Holo / Sticker" />
        <LegendDot color="#2a6a4a" label="✓ Déjà dans la collection" />
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 36, rowGap: 60 }}>
        {cards.map((c, i) => {
          const owned = window.CARAPUCE_OWNED.has(c.id);
          return (
          <article key={c.id} onClick={() => setSelectedCard(c)} style={{ cursor: "pointer" }}>
            <div style={{ aspectRatio: "3/4", marginBottom: 14, position: "relative" }}>
              <CardPlaceholder card={c} variant={["wave", "drop", "shell", "ripple", "depth", "current"][i % 6]} owned={owned} />
            </div>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: MuseumPalette.brass }}>
              {c.lang} · {c.year}
            </div>
            <div style={{ fontFamily: '"Tiempos Headline", Georgia, serif', fontSize: 17, marginTop: 4, letterSpacing: -0.2 }}>
              {c.set}
            </div>
            <div style={{ color: MuseumPalette.inkSoft, fontSize: 12, marginTop: 4 }}>
              {c.variant} · {c.number}
            </div>
          </article>
          );
        })}
      </div>
    </main>
  );
}

function LegendDot({ color, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 10, height: 10, background: color, display: "inline-block" }} />
      {label}
    </span>
  );
}

function MuseumCardDetail({ card, onBack }) {
  const owned = window.CARAPUCE_OWNED.has(card.id);
  return (
    <main style={{ padding: "40px 56px 120px" }}>
      <button onClick={onBack} style={{ ...museumBtn(false), marginBottom: 40, padding: "8px 14px", fontSize: 12 }}>← Retour au catalogue</button>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80 }}>
        <div style={{ aspectRatio: "3/4", position: "relative" }}>
          <CardPlaceholder card={card} variant="hero" large owned={owned} />
        </div>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: MuseumPalette.brass, marginBottom: 20 }}>
            Cartel · Notice
          </div>
          <h1 style={{ fontFamily: '"Tiempos Headline", Georgia, serif', fontSize: 64, fontWeight: 400, margin: 0, lineHeight: 1, letterSpacing: -1.5 }}>
            Carapuce
          </h1>
          <div style={{ fontSize: 22, fontStyle: "italic", color: MuseumPalette.water, marginTop: 6, fontFamily: '"Tiempos Headline", Georgia, serif' }}>
            {card.set}
          </div>
          <table style={{ marginTop: 50, width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <tbody>
              {[
                ["Année", card.year],
                ["Langue", card.lang],
                ["Pays d'édition", card.country],
                ["Numéro", card.number],
                ["Rareté", card.rarity],
                ["Variante", card.variant],
                ["Identifiant interne", card.id],
              ].map(([k, v], i) => (
                <tr key={i} style={{ borderTop: `1px solid ${MuseumPalette.rule}` }}>
                  <td style={{ padding: "16px 0", color: MuseumPalette.inkSoft, width: 200, letterSpacing: 0.2 }}>{k}</td>
                  <td style={{ padding: "16px 0", fontWeight: 500 }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {card.note && (
            <p style={{ marginTop: 30, fontStyle: "italic", color: MuseumPalette.inkSoft, fontSize: 14, paddingLeft: 16, borderLeft: `2px solid ${MuseumPalette.brass}` }}>
              « {card.note} »
            </p>
          )}
          <div style={{ marginTop: 50, display: "flex", gap: 12 }}>
            <button style={museumBtn(true)}>♡ Ajouter à ma wishlist</button>
            <button style={museumBtn(false)}>Signaler une variante</button>
          </div>
        </div>
      </div>
    </main>
  );
}

function MuseumContribute({ setRoute, setSelectedCard }) {
  const [step, setStep] = React.useState(1);
  return (
    <main style={{ padding: "80px 56px 120px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: MuseumPalette.brass, marginBottom: 18 }}>
        Devenir contributeur
      </div>
      <h1 style={{ fontFamily: '"Tiempos Headline", Georgia, serif', fontSize: 64, fontWeight: 400, margin: 0, letterSpacing: -1.5 }}>
        La Maison s'agrandit<br />avec vous.
      </h1>
      <p style={{ fontSize: 17, lineHeight: 1.6, color: MuseumPalette.inkSoft, marginTop: 24, maxWidth: 600 }}>
        Vous possédez une carte qui n'est pas dans l'archive ? Vous voulez offrir un
        item à la collection ? Choisissez votre voie.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginTop: 60 }}>
        {[
          { n: "I", t: "Recenser une carte", d: "Ajoutez une carte manquante à la base : photo, set, langue, variante." },
          { n: "II", t: "Offrir un item", d: "Envoyez une carte, un sticker ou un objet pour agrandir la collection physique." },
          { n: "III", t: "Corriger une notice", d: "Vous avez repéré une erreur ? Suggérez une correction." },
        ].map((c, i) => (
          <button key={i} onClick={() => setStep(i + 1)} style={{
            textAlign: "left", padding: "32px 28px", background: step === i + 1 ? MuseumPalette.ink : MuseumPalette.card,
            color: step === i + 1 ? MuseumPalette.bg : MuseumPalette.ink,
            border: `1px solid ${MuseumPalette.ink}`, cursor: "pointer", fontFamily: "inherit",
          }}>
            <div style={{ fontSize: 11, letterSpacing: 3, opacity: 0.6 }}>VOIE {c.n}</div>
            <div style={{ fontFamily: '"Tiempos Headline", Georgia, serif', fontSize: 22, marginTop: 14, letterSpacing: -0.2 }}>{c.t}</div>
            <div style={{ fontSize: 13, marginTop: 12, lineHeight: 1.5, opacity: 0.85 }}>{c.d}</div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 60, padding: 40, border: `1px solid ${MuseumPalette.rule}`, background: MuseumPalette.card }}>
        {step === 1 && <ContribFormCard />}
        {step === 2 && <ContribFormItem />}
        {step === 3 && <ContribFormCorrection />}
      </div>

      {/* OWNED COLLECTION — what the curator already has */}
      <OwnedCollectionPreview setSelectedCard={setSelectedCard} />
    </main>
  );
}

function OwnedCollectionPreview({ setSelectedCard }) {
  const owned = window.CARAPUCE_CARDS.filter(c => window.CARAPUCE_OWNED.has(c.id));
  return (
    <section style={{ marginTop: 100, paddingTop: 60, borderTop: `1px solid ${MuseumPalette.rule}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 36, gap: 40 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: MuseumPalette.brass, marginBottom: 14 }}>
            Avant d'envoyer — la collection physique
          </div>
          <h2 style={{ fontFamily: '"Tiempos Headline", Georgia, serif', fontSize: 40, fontWeight: 400, margin: 0, letterSpacing: -0.8 }}>
            Voici ce qui se trouve déjà<br />dans le coffret du conservateur.
          </h2>
          <p style={{ fontSize: 14, color: MuseumPalette.inkSoft, marginTop: 18, maxWidth: 540 }}>
            Ces cartes ne sont <strong>pas</strong> nécessaires — gardez-les pour vous, ou échangez-les avec un autre fan. Toute autre carte de l'archive est la bienvenue.
          </p>
        </div>
        <div style={{ textAlign: "right", paddingTop: 8 }}>
          <div style={{ fontFamily: '"Tiempos Headline", Georgia, serif', fontSize: 56, lineHeight: 1, letterSpacing: -1.5 }}>{owned.length}</div>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: MuseumPalette.inkSoft, marginTop: 6 }}>cartes en main</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
        {owned.map((c, i) => (
          <article key={c.id} onClick={() => setSelectedCard(c)} style={{ cursor: "pointer", position: "relative" }}>
            <div style={{ aspectRatio: "3/4", position: "relative" }}>
              <CardPlaceholder card={c} variant={["wave", "drop", "shell", "ripple", "depth", "current"][i % 6]} owned={true} />
              {/* Cross-out overlay so it reads as "don't send" */}
              <div style={{ position: "absolute", inset: 0, background: "rgba(243,239,231,0.55)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%) rotate(-8deg)", padding: "6px 14px", background: MuseumPalette.ink, color: MuseumPalette.bg, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", fontFamily: 'ui-monospace, monospace' }}>déjà reçue</div>
            </div>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: MuseumPalette.brass, marginTop: 10 }}>{c.lang} · {c.year}</div>
            <div style={{ fontFamily: '"Tiempos Headline", Georgia, serif', fontSize: 15, marginTop: 4, letterSpacing: -0.2 }}>{c.set}</div>
            <div style={{ color: MuseumPalette.inkSoft, fontSize: 12, marginTop: 3 }}>{c.variant} · {c.number}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

function MuseumDonateurs() {
  const list = window.CARAPUCE_CONTRIBUTORS;
  const top3 = list.slice(0, 3);
  return (
    <main style={{ padding: "80px 56px 120px" }}>
      <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: MuseumPalette.brass, marginBottom: 18 }}>
        Mur des donateurs
      </div>
      <h1 style={{ fontFamily: '"Tiempos Headline", Georgia, serif', fontSize: 64, fontWeight: 400, margin: 0, letterSpacing: -1.5, maxWidth: 800 }}>
        Sans eux,<br /><em style={{ color: MuseumPalette.water }}>la Maison serait vide.</em>
      </h1>
      <p style={{ fontSize: 16, lineHeight: 1.6, color: MuseumPalette.inkSoft, marginTop: 24, maxWidth: 580 }}>
        Classement par contributions cumulées — fiches recensées et items envoyés. Mis à jour chaque lundi.
      </p>

      {/* Podium */}
      <div style={{ marginTop: 70, display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr", gap: 24, alignItems: "end" }}>
        {[top3[1], top3[0], top3[2]].map((c, i) => {
          const isFirst = c.rank === 1;
          return (
            <div key={c.handle} style={{
              padding: isFirst ? "40px 28px" : "30px 24px",
              background: isFirst ? MuseumPalette.ink : MuseumPalette.card,
              color: isFirst ? MuseumPalette.bg : MuseumPalette.ink,
              border: `1px solid ${MuseumPalette.ink}`,
              minHeight: isFirst ? 280 : 220,
              display: "flex", flexDirection: "column", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: isFirst ? MuseumPalette.brass : MuseumPalette.brass, marginBottom: 14 }}>
                  № 0{c.rank} {isFirst && "· conservateur"}
                </div>
                <div style={{ fontFamily: '"Tiempos Headline", Georgia, serif', fontSize: isFirst ? 38 : 28, lineHeight: 1, letterSpacing: -0.5 }}>
                  @{c.handle}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8, letterSpacing: 0.3 }}>{c.country} · depuis {c.since}</div>
              </div>
              <div style={{ display: "flex", gap: 24, marginTop: 28, fontSize: 12 }}>
                <div>
                  <div style={{ fontFamily: '"Tiempos Headline", Georgia, serif', fontSize: 32, lineHeight: 1 }}>{c.cards}</div>
                  <div style={{ opacity: 0.7, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>fiches</div>
                </div>
                <div>
                  <div style={{ fontFamily: '"Tiempos Headline", Georgia, serif', fontSize: 32, lineHeight: 1 }}>{c.items}</div>
                  <div style={{ opacity: 0.7, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>items</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full table */}
      <div style={{ marginTop: 80 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: MuseumPalette.brass, marginBottom: 16 }}>
          Tous les donateurs
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${MuseumPalette.rule}` }}>
              <th style={th()}>№</th>
              <th style={th()}>Donateur</th>
              <th style={th()}>Pays</th>
              <th style={{ ...th(), textAlign: "right" }}>Fiches</th>
              <th style={{ ...th(), textAlign: "right" }}>Items</th>
              <th style={{ ...th(), textAlign: "right" }}>Depuis</th>
            </tr>
          </thead>
          <tbody>
            {list.map(c => (
              <tr key={c.handle} style={{ borderBottom: `1px solid ${MuseumPalette.rule}33` }}>
                <td style={td()}>{String(c.rank).padStart(2, "0")}</td>
                <td style={{ ...td(), fontFamily: '"Tiempos Headline", Georgia, serif', fontSize: 17 }}>@{c.handle}</td>
                <td style={td()}>{c.country}</td>
                <td style={{ ...td(), textAlign: "right" }}>{c.cards}</td>
                <td style={{ ...td(), textAlign: "right" }}>{c.items}</td>
                <td style={{ ...td(), textAlign: "right", color: MuseumPalette.inkSoft }}>{c.since}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function th() {
  return { textAlign: "left", padding: "14px 12px", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: MuseumPalette.inkSoft, fontWeight: 500 };
}
function td() {
  return { padding: "18px 12px" };
}

function ContribFormCard() {
  return (
    <div>
      <div style={{ fontFamily: '"Tiempos Headline", Georgia, serif', fontSize: 28, marginBottom: 8 }}>Recenser une carte</div>
      <div style={{ color: MuseumPalette.inkSoft, fontSize: 13, marginBottom: 28 }}>Tous les champs sauf indication sont requis.</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <FormField label="Nom du set" placeholder="ex. Set de Base, Évolutions…" />
        <FormField label="Année" placeholder="1999" />
        <FormField label="Langue" placeholder="FR / EN / JP / DE…" />
        <FormField label="Numéro de carte" placeholder="63/102" />
        <FormField label="Variante" placeholder="Édition 1, Reverse, Shadowless…" />
        <FormField label="Pays d'édition" placeholder="FR" />
      </div>
      <div style={{ marginTop: 24 }}>
        <FormField label="Notes (optionnel)" placeholder="Tout ce qui vous semble important." textarea />
      </div>
      <div style={{ marginTop: 24, padding: "20px 24px", border: `1.5px dashed ${MuseumPalette.rule}`, textAlign: "center", color: MuseumPalette.inkSoft, fontSize: 13 }}>
        Glissez-déposez les photos recto/verso ici (300 dpi recommandé)
      </div>
      <div style={{ marginTop: 32, display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button style={museumBtn(false)}>Sauvegarder en brouillon</button>
        <button style={museumBtn(true)}>Soumettre pour validation</button>
      </div>
    </div>
  );
}
function ContribFormItem() {
  return (
    <div>
      <div style={{ fontFamily: '"Tiempos Headline", Georgia, serif', fontSize: 28, marginBottom: 8 }}>Offrir un item</div>
      <div style={{ color: MuseumPalette.inkSoft, fontSize: 13, marginBottom: 28 }}>
        Adresse de réception : <em>La Maison de Carapuce, BP 007, France</em>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <FormField label="Votre nom" placeholder="Pour le mur des donateurs" />
        <FormField label="Votre email" placeholder="vous@exemple.fr" />
        <FormField label="Type d'item" placeholder="Carte / Sticker Topps / Objet dérivé" />
        <FormField label="Voulez-vous un accusé de réception ?" placeholder="Oui / Non" />
      </div>
      <div style={{ marginTop: 24 }}>
        <FormField label="Description de l'item" placeholder="Set, langue, état…" textarea />
      </div>
      <div style={{ marginTop: 32, display: "flex", justifyContent: "flex-end" }}>
        <button style={museumBtn(true)}>Annoncer mon envoi</button>
      </div>
    </div>
  );
}
function ContribFormCorrection() {
  return (
    <div>
      <div style={{ fontFamily: '"Tiempos Headline", Georgia, serif', fontSize: 28, marginBottom: 8 }}>Corriger une notice</div>
      <div style={{ color: MuseumPalette.inkSoft, fontSize: 13, marginBottom: 28 }}>Toute correction est revue par deux conservateurs avant publication.</div>
      <FormField label="Identifiant de la carte" placeholder="ex. BS-63-FR-1999" />
      <div style={{ marginTop: 24 }}>
        <FormField label="Quelle information est incorrecte ?" placeholder="" textarea />
      </div>
      <div style={{ marginTop: 24 }}>
        <FormField label="Source / preuve" placeholder="Lien, scan, référence éditoriale…" />
      </div>
      <div style={{ marginTop: 32, display: "flex", justifyContent: "flex-end" }}>
        <button style={museumBtn(true)}>Envoyer la correction</button>
      </div>
    </div>
  );
}

function FormField({ label, placeholder, textarea }) {
  return (
    <label style={{ display: "block", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: MuseumPalette.inkSoft }}>
      {label}
      {textarea ? (
        <textarea placeholder={placeholder} rows={4} style={{
          width: "100%", marginTop: 8, padding: "10px 0", fontFamily: "inherit", fontSize: 14,
          border: "none", borderBottom: `1px solid ${MuseumPalette.rule}`, background: "transparent",
          color: MuseumPalette.ink, outline: "none", resize: "vertical",
        }} />
      ) : (
        <input placeholder={placeholder} style={{
          width: "100%", marginTop: 8, padding: "10px 0", fontFamily: "inherit", fontSize: 14,
          border: "none", borderBottom: `1px solid ${MuseumPalette.rule}`, background: "transparent",
          color: MuseumPalette.ink, outline: "none",
        }} />
      )}
    </label>
  );
}

function MuseumFooter() {
  return (
    <footer style={{ padding: "60px 56px 50px", borderTop: `1px solid ${MuseumPalette.rule}`, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 50, fontSize: 13 }}>
      <div>
        <div style={{ fontFamily: '"Tiempos Headline", Georgia, serif', fontSize: 18 }}>La Maison de Carapuce</div>
        <p style={{ color: MuseumPalette.inkSoft, marginTop: 12, lineHeight: 1.6 }}>
          Archive non-officielle, à but non-lucratif. Site de fans, par des fans. Pokémon, Carapuce et toutes les marques associées appartiennent à leurs ayants droit respectifs.
        </p>
      </div>
      {[
        { t: "Archive", l: ["Catalogue", "Sets", "Langues", "Stickers Topps"] },
        { t: "Communauté", l: ["Contribuer", "Donateurs", "Conservateurs", "Forum"] },
        { t: "Maison", l: ["Manifeste", "Adresse postale", "Contact", "Mentions légales"] },
      ].map((c, i) => (
        <div key={i}>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: MuseumPalette.brass, marginBottom: 14 }}>{c.t}</div>
          {c.l.map(x => <div key={x} style={{ marginTop: 8, color: MuseumPalette.ink }}>{x}</div>)}
        </div>
      ))}
    </footer>
  );
}

function museumBtn(primary) {
  return {
    background: primary ? MuseumPalette.ink : "transparent",
    color: primary ? MuseumPalette.bg : MuseumPalette.ink,
    border: `1px solid ${MuseumPalette.ink}`,
    fontFamily: "inherit", fontSize: 13,
    padding: "12px 22px", cursor: "pointer", letterSpacing: 0.3,
  };
}

// ─── Tag system — small badges showing language, variant, ownership ─────
function tagColor(kind, value) {
  // Variant colors
  const variantMap = {
    "Édition 1": "#a07a3a", "1st Edition": "#a07a3a", "1. Auflage": "#a07a3a",
    "Shadowless": "#5a5e6a", "No Rarity": "#2a4a6e",
    "Reverse Holo": "#7a4a8a", "Reverse": "#7a4a8a",
    "Holo": "#a8485a", "Holo Foil": "#a8485a", "Foil Sticker": "#a8485a", "Foil": "#a8485a",
    "Master Ball Foil": "#5a3878", "Poké Ball Foil": "#a85838",
    "Movie Promo": "#d8a050",
    "20th Anniversary": "#a07a3a",
    "Unlimited": "#5a5e6a",
  };
  if (kind === "variant") return variantMap[value] || "#5a5e6a";
  if (kind === "lang") return "#1a1f2c";
  if (kind === "sticker") return "#a8485a";
  return "#5a5e6a";
}

function CardTags({ card, owned = false, position = "top-right", small = false }) {
  const isSticker = card.rarity === "Sticker";
  const sz = small ? { fs: 8, py: 2, px: 5, gap: 3 } : { fs: 9, py: 3, px: 7, gap: 4 };
  const positionStyle = {
    "top-right": { top: 8, right: 8, alignItems: "flex-end" },
    "top-left": { top: 8, left: 8, alignItems: "flex-start" },
    "bottom-right": { bottom: 8, right: 8, alignItems: "flex-end" },
    "bottom-left": { bottom: 8, left: 8, alignItems: "flex-start" },
  }[position];
  const tagStyle = (bg, fg = "#fbf8f1", outline = false) => ({
    background: outline ? "transparent" : bg,
    color: outline ? bg : fg,
    border: outline ? `1px solid ${bg}` : "none",
    padding: `${sz.py}px ${sz.px}px`,
    fontSize: sz.fs,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontWeight: 600,
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    whiteSpace: "nowrap",
    lineHeight: 1,
  });
  return (
    <div style={{ position: "absolute", display: "flex", flexDirection: "column", gap: sz.gap, zIndex: 5, ...positionStyle }}>
      <span style={tagStyle(tagColor("lang", card.lang))}>{card.lang}</span>
      {isSticker && <span style={tagStyle(tagColor("sticker"))}>Sticker</span>}
      {card.variant && card.variant !== "—" && (
        <span style={tagStyle(tagColor("variant", card.variant))}>{card.variant.length > 14 ? card.variant.slice(0, 12) + "…" : card.variant}</span>
      )}
      {owned && <span style={tagStyle("#2a6a4a")}>✓ collection</span>}
    </div>
  );
}

// ─── Card placeholder — abstract, never reproduces actual artwork ──────────
function CardPlaceholder({ card, variant = "wave", large = false, tagPosition = "top-right", showTags = true, owned = false }) {
  // We render a stylized "card-shaped" tile with abstract aquatic motifs
  // and a clear "PLACEHOLDER" label so the user knows to drop in real photos.
  const palettes = {
    wave: ["#cfd8e0", "#7a96b3", "#2a4a6e"],
    drop: ["#e8d8b8", "#c2a05a", "#7a5a28"],
    shell: ["#f0e0c8", "#b88858", "#5a3a1a"],
    ripple: ["#d8e4dc", "#7a9a8a", "#2a5a48"],
    depth: ["#c8d4e8", "#5a78a8", "#1a2a4a"],
    current: ["#dad0e0", "#8a78a8", "#4a3868"],
    hero: ["#d8e4ec", "#5a8aae", "#1a3858"],
  };
  const [c1, c2, c3] = palettes[variant] || palettes.wave;

  return (
    <div style={{
      width: "100%", height: "100%", position: "relative", overflow: "hidden",
      background: c1, border: `1px solid ${MuseumPalette.ink}`,
      boxShadow: large ? "0 30px 80px rgba(20,30,50,0.15)" : "none",
    }}>
      {/* Abstract aquatic SVG */}
      <svg width="100%" height="100%" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id={`g-${variant}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c2} stopOpacity="0.4" />
            <stop offset="100%" stopColor={c3} stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <rect width="300" height="400" fill={`url(#g-${variant})`} />
        {/* Concentric arcs evoking ripples / shell */}
        {[0, 1, 2, 3, 4].map(i => (
          <circle key={i} cx="150" cy="240" r={40 + i * 30} fill="none" stroke={c3} strokeOpacity={0.2 - i * 0.03} strokeWidth="1" />
        ))}
        {/* Horizon line */}
        <line x1="20" y1="100" x2="280" y2="100" stroke={c3} strokeOpacity="0.4" strokeWidth="0.8" />
        {/* Sun/moon */}
        <circle cx="220" cy="80" r="14" fill={c1} stroke={c3} strokeOpacity="0.5" />
      </svg>
      {/* Inner frame */}
      <div style={{ position: "absolute", inset: 12, border: `1px solid ${c3}`, opacity: 0.5 }} />
      {/* Tags */}
      {card && showTags && <CardTags card={card} owned={owned} position={tagPosition} small={!large} />}
      {/* Label */}
      <div style={{ position: "absolute", bottom: 16, left: 16, right: 16, textAlign: "center", fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: c3, fontFamily: "ui-monospace, Menlo, monospace" }}>
        photo de carte<br />
        <span style={{ opacity: 0.6 }}>{card ? card.id : "à remplacer"}</span>
      </div>
    </div>
  );
}

window.MuseumDirection = MuseumDirection;
