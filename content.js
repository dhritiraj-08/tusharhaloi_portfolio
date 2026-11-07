/* ==========================================================================
   TUSHAR HALOI — FINAL CUT  ·  content.js
   --------------------------------------------------------------------------
   EVERYTHING you might want to edit lives in this one file:
   text, project titles, categories, years, links and file names.
   You never need to touch index.html / css / js to update the site.

   Tips
   • Wrap a word in *asterisks* to highlight it in red (e.g. "I *cut* it").
   • Anything marked  ⚠ PLACEHOLDER  should be replaced with the real thing.
   • File paths are relative to index.html.
   ========================================================================== */

window.SITE = {

  /* ---------- BASIC INFO --------------------------------------------- */
  meta: {
    title: "Tushar Haloi — Video Editor",
    description: "Tushar Haloi is a video editor from Assam, India — short-form, SaaS promos, client films, colour grading, motion design and graphic design that hit hard.",
    year: 2026
  },

  person: {
    name: "Tushar Haloi",
    first: "Tushar",
    last: "Haloi",
    tagline: "Video Editor",
    location: "Assam, India",                // ⚠ PLACEHOLDER — city / base
    timezone: "Asia/Kolkata",                // used for the live clock in the footer
    availability: "Booking now"              // shows in the hero HUD
  },

  /* ---------- HERO --------------------------------------------------- */
  hero: {
    reel: "site-assets/hero-bg.mp4",               // looping muted background (H.264, made from HERO1BG.mp4)
    reelWebm: "site-assets/hero-bg.webm",          // WebM alternative
    poster: "site-assets/hero-bg-poster.webp",
    slate: { roll: "A001", scene: "01", take: "01", camera: "A-CAM" },
    marquee: ["Video Editor", "Motion Design", "Colour", "Sound", "Graphic Design", "Story"]
  },

  /* ---------- ABOUT -------------------------------------------------- */
  about: {
    headline: ["EVERY FRAME", "HAS A *BEAT.*", "I FIND IT."],
    // ⚠ PLACEHOLDER — rewrite in Tushar's own voice. Each item is a paragraph.
    bio: [
      "I'm Tushar — a video editor who thinks in rhythm. Give me a SaaS promo, a reel, a client film or a messy pile of footage and I'll find the beat that makes people feel something.",
      "I cut, colour-grade, sound-design and animate everything from scroll-stopping short-form to clean product videos — and I design the posters and thumbnails that go with them.",
      "I care about the moment before the cut as much as the cut itself. If it doesn't move you in the first three seconds, I'll cut it again."
    ],
    portrait: "site-assets/img/profile.webp",     // made from "profile picture.jpeg" (original untouched)
    portraitAlt: "Portrait of Tushar Haloi",
    // ⚠ PLACEHOLDER numbers — set the real ones
    stats: [
      { value: 3,  suffix: "+", label: "Years on the timeline" },
      { value: 50, suffix: "+", label: "Projects delivered" },
      { value: 4,  suffix: "",  label: "Signature edit styles" },
      { value: 10, suffix: "+", label: "Brands & creators cut for" }
    ],
    // ⚠ PLACEHOLDER gear list
    kit: ["Premiere Pro", "After Effects", "DaVinci Resolve", "Photoshop"],

    /* The mock editing timeline. start/len are 0–100 (% of timeline width).
       color: red | amber | violet | bone   ·   edit freely */
    timeline: {
      title: "SEQUENCE 01 — SKILLS & TOOLS",
      tracks: [
        { id: "V3", name: "Motion",  clips: [ { label: "Motion design",  note: "Animation & kinetic graphics", start: 1,  len: 24, color: "violet" },
                                              { label: "After Effects", note: "Motion graphics & titles",     start: 28, len: 26, color: "violet" },
                                              { label: "Typography",    note: "Kinetic type",                 start: 58, len: 22, color: "violet" },
                                              { label: "Logo stings",   note: "Intros & idents",              start: 83, len: 16, color: "violet" } ] },
        { id: "V2", name: "Grade",   clips: [ { label: "DaVinci Resolve", note: "Colour grading",         start: 14, len: 34, color: "amber" },
                                              { label: "LUT design",      note: "Looks & film emulation", start: 66, len: 26, color: "amber" } ] },
        { id: "V1", name: "Edit",    clips: [ { label: "Premiere Pro",   note: "Story & rhythm cutting",  start: 0,  len: 46, color: "red" },
                                              { label: "Short-form",     note: "Reels & shorts that hold", start: 48, len: 30, color: "red" },
                                              { label: "Delivery",       note: "All formats, all socials", start: 80, len: 18, color: "red" } ] },
        { id: "A1", name: "Sound",   clips: [ { label: "Sound design",   note: "Atmos, hits & risers",    start: 8,  len: 30, color: "bone" },
                                              { label: "Dialogue clean-up", note: "Voice & interviews",   start: 52, len: 38, color: "bone" } ] },
        { id: "A2", name: "Music",   clips: [ { label: "Beat-sync cutting", note: "Cut on the drop",      start: 20, len: 40, color: "bone" } ] },
        { id: "GFX", name: "Design", clips: [ { label: "Graphic design", note: "Posters & key art",       start: 0,  len: 36, color: "amber" },
                                              { label: "Thumbnails",     note: "Clicks start here",       start: 40, len: 26, color: "amber" },
                                              { label: "Branding",       note: "Identity & layouts",      start: 70, len: 28, color: "amber" } ] }
      ]
    }
  },

  /* ---------- WORK (the 4 folders) ------------------------------------
     The folders, covers and clips come straight from the  Video/  folder:
         Video/<folder name>/cover video.mp4   → plays on that folder's card
         Video/<folder name>/<other clips>.mp4 → shown in the grid when the card is opened
     After adding / renaming videos, double-click  update-videos.bat  (it rebuilds the web
     versions into site-assets/work/ — your originals are never touched).

     Optional overrides below (all optional). Keys are the folder name, or "folder/file name"
     (without .mp4):
        label / title : what to show instead of the file name
        blurb, year, client : extra info shown in the player
        embed : { provider: "youtube", id: "VIDEO_ID" }  → play from YouTube instead of the file */
  reel: {
    heading: "SELECTED *WORK*",
    intro: "Pick a folder. Open it. Press play.",
    overrides: {
      "Client Work":       { label: "Client Work",       blurb: "Films made for real clients, start to finish." },
      "Colorgrading":      { label: "Colorgrading",      blurb: "Grades, looks and colour-led edits." },
      "Motion Design":     { label: "Motion Design",     blurb: "Clean product, SaaS and podcast edits with tight motion and sound design." },
      "Short form Videos": { label: "Short Form Videos", blurb: "Reels and shorts built to stop the scroll." },

      "Client Work/kitefest (better) longform":  { title: "Kitefest — Longform", year: "2025" },
      "Colorgrading/CG1":                        { title: "CG1 — Colour Grade", year: "2025" },
      "Motion Design/final saas sfx 111":        { title: "SaaS Promo — SFX Cut", year: "2025" },
      "Motion Design/MACC":                      { title: "MACC", year: "2025" },
      "Motion Design/new apple":                 { title: "New Apple", year: "2025" },
      "Motion Design/viral podcast edit style":  { title: "Viral Podcast Edit Style", year: "2025" },
      "Short form Videos/123":                   { title: "123", year: "2025" },
      "Short form Videos/2nd acc made":          { title: "2nd Acc Made", year: "2025" },
      "Short form Videos/Puja 1":                { title: "Puja 1", year: "2025" },
      "Short form Videos/cm ":                   { title: "CM", year: "2025" },
      "Short form Videos/pagla is pagla":        { title: "Pagla Is Pagla", year: "2025" },
      "Short form Videos/v1 sfx":                { title: "V1 — SFX", year: "2025" }
    }
  },

  /* ---------- POSTERS ------------------------------------------------ */
  posters: {
    heading: "GRAPHIC *DESIGN*",
    intro: "Drag the wall. Click a frame.",
    // w / h = original pixel size (used for the correct aspect ratio)
    // file = wall image · full = full-resolution image shown in the lightbox · thumb = lightbox strip
    items: [
      { title: "Zubeen Da — The Lord",             category: "Tribute Poster", year: "2025", file: "site-assets/posters/poster1.webp", full: "site-assets/posters/poster1-hd.webp", thumb: "site-assets/posters/poster1-thumb.webp", w: 1240, h: 1754, alt: "Tribute poster for singer Zubeen Garg in maroon and sun-yellow halftone" },
      { title: "A Local's Honest Opinion",         category: "Thumbnail",      year: "2025", file: "site-assets/posters/poster2.webp", full: "site-assets/posters/poster2-hd.webp", thumb: "site-assets/posters/poster2-thumb.webp", w: 1920, h: 1080, alt: "Video thumbnail with two men in conversation and bold title text" },
      { title: "Partnership Proposal",             category: "Branding",       year: "2025", file: "site-assets/posters/poster3.webp", full: "site-assets/posters/poster3-hd.webp", thumb: "site-assets/posters/poster3-thumb.webp", w: 2160, h: 2700, alt: "Sky-blue partnership proposal poster showing Tezpur University gate" },
      { title: "Fashion Killa",                    category: "Editorial",      year: "2025", file: "site-assets/posters/poster4.webp", full: "site-assets/posters/poster4-hd.webp", thumb: "site-assets/posters/poster4-thumb.webp", w: 2160, h: 2880, alt: "Black and white editorial poster with bold FASHION KILLA lettering" },
      { title: "Open Debates",                     category: "Event Poster",   year: "2025", file: "site-assets/posters/poster5.webp", full: "site-assets/posters/poster5-hd.webp", thumb: "site-assets/posters/poster5-thumb.webp", w: 2160, h: 2704, alt: "Dark red poster of a lone figure among empty chairs, titled Ideology" },
      { title: "Guess Who's Coming",               category: "Event Poster",   year: "2025", file: "site-assets/posters/poster6.webp", full: "site-assets/posters/poster6-hd.webp", thumb: "site-assets/posters/poster6-thumb.webp", w: 2160, h: 2704, alt: "Electric blue event poster with two smiling friends in sunglasses" },
      { title: "Maac Café — Menu",                 category: "Branding",       year: "2025", file: "site-assets/posters/poster7.webp", full: "site-assets/posters/poster7-hd.webp", thumb: "site-assets/posters/poster7-thumb.webp", w: 1920, h: 1080, alt: "Red and orange pizza café menu spread with a 15 percent off offer" }
    ]
  },

  /* ---------- CONTACT ------------------------------------------------ */
  contact: {
    headline: "LET'S MAKE SOMETHING *CINEMATIC.*",
    hire: "HIRE ME AS YOUR *VIDEO EDITOR.*",
    sub: "Reels, promos, a brand film or a wild idea at 2 a.m. — tell me about it.",
    email: "tusharkalitahaloi@gmail.com",
    whatsapp: "916001326510",                      // country code (91) + number, digits only
    projectTypes: ["Short-form / Reels", "SaaS / Product video", "Client film", "Colour grading", "Motion design", "Graphic design", "Something else"],
        socials: [
      // The Instagram url is also what the round "SAY HELLO" button opens (new tab).
      { key: "instagram", label: "Instagram", handle: "@tusharhaloi_", url: "https://www.instagram.com/tusharhaloi_/" }
    ],
    credits: [
      ["Cut by",      "Tushar Haloi"],
      ["Colour",      "Tushar Haloi"],
      ["Motion",      "Tushar Haloi"],
      ["Sound",       "Tushar Haloi (and a lot of coffee)"],
      ["Special thanks", "Every client who said “just make it cinematic”"],
      ["Built with",  "Light, grain and a very patient playhead"]
    ]
  },

  /* ---------- CAMERA READOUTS (per section — just for flavour) -------- */
  cam: {
    hero:    { iso: "800",  shutter: "1/48",  f: "2.8", k: "5600K" },
    about:   { iso: "400",  shutter: "1/50",  f: "1.8", k: "4300K" },
    reel:    { iso: "1600", shutter: "1/48",  f: "2.0", k: "3200K" },
    posters: { iso: "100",  shutter: "1/125", f: "5.6", k: "6500K" },
    contact: { iso: "3200", shutter: "1/24",  f: "1.4", k: "2800K" }
  }
};
