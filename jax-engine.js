/* DiamondIQ — Pure Coach Jax Scouting & Coaching Engine (Zero-Key + Grounded)
   CommonJS + browser safe pure functions for beginner guidance, mechanical flaw diagnosis,
   bat/Rapsodo analysis, and photo-verified ballpark scouting reports across Pro, College & HS tiers. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.DiamondJax = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const VALID_CLINICS = {
    'bat-drag': {
      title: 'Keep Your Hands Connected (Bat Drag Fix)',
      domain: 'Hitting Mechanics',
      scenarioId: 'launch-angle-exit-velo',
      youtube: { label: 'MLB Bat Drag Fix Drill (YouGoProBaseball)', url: 'https://www.youtube.com/watch?v=bkXB66PSKvw' }
    },
    casting: {
      title: 'Stay Short & Inside the Ball (Stop Casting)',
      domain: 'Hitting Mechanics',
      scenarioId: 'launch-angle-exit-velo',
      youtube: { label: 'Improve Your Bat Path (Antonelli Baseball)', url: 'https://www.youtube.com/watch?v=oh9rdbm6ne8' }
    },
    'rolling-over': {
      title: 'Drive Line Drives (Stop Rolling Over)',
      domain: 'Hitting Mechanics',
      scenarioId: 'xwoba-metrics',
      youtube: { label: 'Why You Roll Over & Fix (Ultimate Baseball Training)', url: 'https://www.youtube.com/watch?v=0Qa-GRJ7CE0' }
    },
    lunging: {
      title: 'Stay Balanced on Off-Speed & Timing',
      domain: 'Hitting Mechanics',
      scenarioId: 'xwoba-metrics',
      youtube: { label: 'Keep Your Load with Stride (DNA Sports)', url: 'https://www.youtube.com/watch?v=FQus_SP0DKQ' }
    },
    'glove-stab': {
      title: 'Soft Hands & Infield Funnel Routine',
      domain: 'Fielding Mechanics',
      scenarioId: 'force-vs-tag',
      youtube: { label: 'Infield Hands Routine (Antonelli Baseball)', url: 'https://www.youtube.com/watch?v=WoSNZqN5G9E' }
    },
    'footwork-cadence': {
      title: 'Infield Footwork & Smooth Exchanges',
      domain: 'Fielding Mechanics',
      scenarioId: 'stealing-second',
      youtube: { label: 'Infield Footwork Drills (Antonelli Baseball)', url: 'https://www.youtube.com/watch?v=0_Z3vLKtVl4' }
    },
    'banana-route': {
      title: '45° Outfield Drop Step & Direct Routes',
      domain: 'Fielding Mechanics',
      scenarioId: 'tagging-up',
      youtube: { label: 'Outfield Drop Step Guide (Antonelli Baseball)', url: 'https://www.youtube.com/watch?v=tH9-7NyhtTg' }
    },
    'crow-hop': {
      title: 'Clean Crow Hop & Relay Throws',
      domain: 'Fielding Mechanics',
      scenarioId: 'relay-throw',
      youtube: { label: 'Outfield Crow Hop vs. Step Behind (Ultimate Baseball Training)', url: 'https://www.youtube.com/watch?v=vMU7ds_WpiM' }
    }
  };

  const VALID_BATS = {
    'baum-gold': 'Baum Bat Gold (PermaWood Composite -3)',
    'victus-v243': 'Victus V243 Pro Reserve Maple (Honey/Black -3)',
    'ls-c271': 'Louisville Slugger Prime C271 Maple (Espresso/Gold -3)',
    'old-hickory-j143': 'Old Hickory J143M Pro Maple (Chestnut/Walnut -3)',
    'goods-2026': '2026 DeMarini The Goods (Ice Blue/Black/Red Hybrid -3)',
    'goods-2022': '2022 DeMarini The Goods (Chrome Silver/Black Hybrid -3)',
    'warstic-bonesaber': 'Warstic Bonesaber Hybrid (Katana2X Alloy/Tsuka -3)',
    'voodoo-one': '2026 DeMarini Voodoo One (Crimson X14 1-Pc Alloy -3)',
    'ls-atlas': 'Louisville Slugger Atlas EVO-K (Graphite/Cyan 1-Pc SL Alloy -3)',
    'stringking-metal2': 'StringKing Metal 2 Pro (Titanium Raw 1-Pc Alloy -3)',
    'combat-rodeo': 'Combat MFG Spec-A1 Rodeo (Cream/Maroon 1-Pc Alloy -3)',
    'combat-blue': 'Combat Spec-A1 Members Club Blue (Powder Blue 1-Pc Alloy -3)',
    'marucci-catx2': 'Marucci CATX2 Alloy (Silver/Red AZR 1-Pc Liquid-Gel -3)',
    'victus-vandal': 'Victus Vandal BBCOR (Matte Black Carbon-Cap 1-Pc Alloy -3)',
    'rawlings-icon': 'Rawlings Icon (-3 In/Tense Carbon Composite)',
    'easton-hype': 'Easton Hype Fire (-3 Thermo-Composite)'
  };

  const VALID_SCENARIOS = {
    'force-vs-tag': 'Force Out vs. Tag Out',
    'infield-fly': 'The Infield Fly Rule',
    'stealing-second': 'Stealing 2nd Base',
    'launch-angle-exit-velo': 'Launch Angle & Exit Velocity',
    'catcher-framing': 'Catcher Framing & Strike Zone',
    'relay-throw': 'Relay & Cutoff Throws',
    'xwoba-metrics': 'xwOBA vs. Batting Average',
    'tagging-up': 'Tagging Up on Fly Balls'
  };

  const VALID_STADIUMS = {
    fenway: { name: 'Fenway Park (Boston)', tier: 'pro', dims: '310 LF · 390 CF · 302 RF', note: '37-ft Green Monster in left rewards lifted pull barrels; Pesky Pole sits just 302 ft down the right-field line.' },
    petco: { name: 'Petco Park (San Diego)', tier: 'pro', dims: '336 LF · 396 CF · 322 RF', note: 'Marine San Diego air dampens routine deep flies slightly, while Western Metal brick frames the LF pole at 336 ft.' },
    coors: { name: 'Coors Field (Denver)', tier: 'pro', dims: '347 LF · 415 CF · 350 RF', note: 'At 5,280 ft altitude (0.84 air density), carry climbs ~15–22 ft and breaking balls bite less sharply than sea-level parks.' },
    oracle: { name: 'Oracle Park (San Francisco)', tier: 'pro', dims: '339 LF · 399 CF · 309 RF', note: 'Triples Alley in RCF runs deep before the 24-ft brick arcade wall guarding McCovey Cove at 309 ft down the RF line.' },
    wrigley: { name: 'Wrigley Field (Chicago)', tier: 'pro', dims: '355 LF · 400 CF · 353 RF', note: '11.5-ft ivy-covered brick wall and Lake Michigan winds turn routine flies into HRs or warning-track outs.' },
    yankee: { name: 'Yankee Stadium (New York)', tier: 'pro', dims: '318 LF · 408 CF · 314 RF', note: 'The 314-ft Short Porch in RF rewards lefty pull lift, while straightaway CF plays 408 ft toward Monument Park.' },
    sdsu: { name: 'Tony Gwynn Stadium (SDSU)', tier: 'college', dims: '340 LF · 412 CF · 340 RF', note: 'Spacious 412-ft center gap rewards crisp line drives and gap-to-gap speed over lazy fly balls.' },
    ucsb: { name: 'Caesar Uyesaka Stadium (UC Santa Barbara)', tier: 'college', dims: '335 LF · 400 CF · 335 RF', note: 'Ocean-cooled coastal air below the Santa Ynez mountains plays fair both ways for gap doubles and backspin lift.' },
    'cal-poly': { name: 'Scolinos Field (Cal Poly Pomona)', tier: 'college', dims: '340 LF · 390 CF · 325 RF', note: 'Pomona valley warmth lets squared 26°–30° barrels jump toward the green wall and 325-ft right-field line.' },
    'pk-park': { name: 'PK Park (Oregon)', tier: 'college', dims: '335 LF · 400 CF · 325 RF', note: 'Full synthetic turf means hard ground balls race quickly through the infield gaps in Eugene.' },
    'sc-founders': { name: 'Founders Park (South Carolina)', tier: 'college', dims: '325 LF · 400 CF · 325 RF', note: 'Symmetrical 325-ft corners with warm humid air carry pulled barrels nicely over the garnet-trim wall.' },
    stanford: { name: 'Klein Field at Sunken Diamond (Stanford)', tier: 'college', dims: '335 LF · 400 CF · 335 RF', note: 'Tall surrounding eucalyptus trees and a 10-ft green wall reward low-line carry into the alleys.' },
    usd: { name: 'Fowler Park / Cunningham Field (USD)', tier: 'college', dims: '311 LF · 398 CF · 310 RF', note: 'Friendly 311/310 corners reward controlled inside-out or pull backspin before deep canyon hills.' },
    tcu: { name: 'Lupton Stadium (TCU)', tier: 'college', dims: '330 LF · 400 CF · 330 RF', note: 'Fort Worth night air and crisp turf reward balanced swing plane into the power alleys.' },
    byu: { name: 'Larry H. Miller Field (BYU)', tier: 'college', dims: '345 LF · 402 CF · 345 RF', note: 'Provo elevation (~4,550 ft) against the Wasatch Mountains adds real mountain carry to driven fly balls.' },
    'app-state': { name: 'Beaver Field (Appalachian State)', tier: 'college', dims: '330 LF · 400 CF · 330 RF', note: 'Boone elevation (~3,300 ft) and full turf reward loud line drives into the Blue Ridge mountain backdrop.' },
    vandy: { name: 'Hawkins Field (Vanderbilt)', tier: 'college', dims: '310 LF · 400 CF · 330 RF', note: 'The 35-ft Left-Field Monster turns low pull shots into loud singles/doubles unless lifted above 28°.' },
    ucla: { name: 'Jackie Robinson Stadium (UCLA)', tier: 'college', dims: '330 LF · 395 CF · 330 RF', note: 'Coastal Westwood air and clean natural grass reward middle-of-the-field line drives.' },
    'hs-rb': { name: 'Rancho Bernardo HS (San Diego)', tier: 'hs', dims: '315 LF · 385 CF · 315 RF', note: 'Classic San Diego varsity dimensions — clean gap shots carry past the CF batter’s eye.' },
    'hs-corona': { name: 'Corona High School (CA)', tier: 'hs', dims: '315 LF · 380 CF · 315 RF', note: 'Crisp Inland Empire warmth makes 90+ mph exit velos at 24°–30° fly past the red LF scoreboard.' },
    'hs-eastlake': { name: 'Eastlake High School (San Diego)', tier: 'hs', dims: '312 LF · 380 CF · 312 RF', note: 'Tight 312-ft corners in Chula Vista turn well-timed pull and opposite-field backspin into extra-base trouble.' },
    'hs-cchs': { name: 'Cathedral Catholic HS — Lynch Allred Field (San Diego)', tier: 'hs', dims: '318 LF · 385 CF · 315 RF', note: 'Forest-green windscreen with yellow cap, crimson-gold CC halo behind plate, LF red scoreboard, and Spanish hillside dorms behind RF.' },
    'hs-tp': { name: 'Torrey Pines HS — Falcons Field (San Diego)', tier: 'hs', dims: '320 LF · 390 CF · 318 RF', note: 'Burgundy outfield wall, concrete terraced bleachers rising behind the green CF batter’s eye, and coastal eucalyptus trees.' },
    'hs-monte-vista': { name: 'Monte Vista HS — Monarchs Field (Spring Valley)', tier: 'hs', dims: '316 LF · 384 CF · 316 RF', note: 'Maroon Monarchs outfield fence, maroon MV foul turf aprons, and terraced hillside behind CF/RF.' },
    'hs-poway': { name: 'Poway HS — Titan Field (San Diego)', tier: 'hs', dims: '322 LF · 392 CF · 320 RF', note: 'Navy windscreen fence, concentric mowed grass, blue CF scoreboard, and North County foothills.' },
    'hs-granite': { name: 'Granite Hills HS — Eagles Field (El Cajon)', tier: 'hs', dims: '320 LF · 388 CF · 318 RF', note: 'Navy Granite Hills wall, RCF Sycuan scoreboard, red football track outside LF, and El Cajon granite peaks behind CF.' },
    'hs-santana': { name: 'Santana High School — Sultans Field (Santee)', tier: 'hs', dims: '318 LF · 385 CF · 315 RF', note: 'Black windscreen with yellow top cap, bold white SANTANA wall lettering, purple halo behind plate, and Mission Trails ridge.' },
    'hs-grossmont': { name: 'Grossmont High School — Gizoni Field (El Cajon)', tier: 'hs', dims: '320 LF · 390 CF · 318 RF', note: 'Royal-blue windscreen with yellow cap, Welcome to Gizoni Field sign, LF scoreboard, and solar parking canopies beyond RCF.' },
    'hs-valhalla': { name: 'Valhalla High School — Norsemen Field (El Cajon)', tier: 'hs', dims: '316 LF · 382 CF · 316 RF', note: 'Blue VALHALLA BASEBALL LF fence, Norsemen RCF scoreboard, orange-and-blue turf letters, and steep chaparral hill behind CF/RCF.' },
    cage: { name: 'D1 Rapsodo Lab (Indoor)', tier: 'cage', dims: '400 FT Simulated Net', note: 'Full indoor tunnel with cushioned hitting mat, L-screen, and optical Rapsodo tracking — focus on smash factor and attack angle.' }
  };

  function isValidGeminiKey(raw) {
    if (typeof raw !== 'string') return false;
    const trimmed = raw.trim();
    if (!trimmed) return false;
    // Reject obvious placeholder env strings (e.g. "GEMINI_API_KEY", "your_key_here", "undefined")
    return /^AIza[0-9A-Za-z_-]{20,}$/.test(trimmed);
  }

  function parseDelimitedJaxResponse(rawText) {
    const text = String(rawText || '').trim();
    const sections = {};
    let currentKey = 'REPLY';
    sections[currentKey] = [];

    for (const rawLine of text.split(/\r?\n/)) {
      const trimmed = rawLine.trim();
      const matched = trimmed.match(/^\*{0,2}(REPLY|TIPS|CLINICS|SCENARIOS|BAT|YOUTUBE_TOPICS|FOLLOW_UPS)\*{0,2}\s*:\s*(.*)$/i);
      if (matched) {
        currentKey = matched[1].toUpperCase();
        if (!sections[currentKey]) sections[currentKey] = [];
        if (matched[2] && matched[2].trim()) {
          sections[currentKey].push(matched[2].trim());
        }
      } else if (trimmed) {
        if (!sections[currentKey]) sections[currentKey] = [];
        sections[currentKey].push(trimmed);
      }
    }

    const reply = (sections.REPLY || []).join('\n').trim() || text.slice(0, 700);
    const tips = (sections.TIPS || [])
      .join('\n')
      .split(/\n|;/)
      .map((line) => line.replace(/^[-*•\d.)\s]+/, '').trim())
      .filter((line) => line.length > 4)
      .slice(0, 4);

    const clinicTokens = (sections.CLINICS || []).join(',').toLowerCase().match(/[a-z0-9-]+/g) || [];
    const scenarioTokens = (sections.SCENARIOS || []).join(',').toLowerCase().match(/[a-z0-9-]+/g) || [];
    const batTokens = (sections.BAT || []).join(',').toLowerCase().match(/[a-z0-9-]+/g) || [];
    const ytTopics = (sections.YOUTUBE_TOPICS || [])
      .join('\n')
      .split(/\n|,|;/)
      .map((t) => t.replace(/^[-*•\d.)\s]+/, '').trim())
      .filter((t) => t.length > 2)
      .slice(0, 2);
    const followUps = (sections.FOLLOW_UPS || [])
      .join('\n')
      .split(/\n|\|/)
      .map((t) => t.replace(/^[-*•\d.)\s]+/, '').trim())
      .filter((t) => t.length > 4)
      .slice(0, 3);

    return {
      reply,
      tips,
      clinicTokens,
      scenarioTokens,
      batId: batTokens.find((b) => VALID_BATS[b]) || 'goods-2026',
      ytTopics,
      followUps
    };
  }

  function matchStadiumMention(low) {
    const aliases = [
      ['fenway', ['fenway', 'green monster', 'boston', 'pesky']],
      ['petco', ['petco', 'padres', 'western metal']],
      ['coors', ['coors', 'denver', 'mile high', 'rockies']],
      ['oracle', ['oracle', 'mccovey', 'giants', 'triples alley']],
      ['wrigley', ['wrigley', 'cubs', 'ivy']],
      ['yankee', ['yankee', 'short porch', 'monument park']],
      ['sdsu', ['sdsu', 'tony gwynn', 'aztec', 'san diego state']],
      ['ucsb', ['ucsb', 'santa barbara', 'gaucho', 'uyesaka']],
      ['cal-poly', ['cal poly', 'cal-poly', 'pomona', 'scolinos', 'bronco']],
      ['pk-park', ['pk park', 'oregon', 'ducks', 'kilkenny']],
      ['sc-founders', ['founders', 'south carolina', 'gamecock']],
      ['stanford', ['stanford', 'sunken diamond', 'klein field']],
      ['usd', ['usd', 'fowler', 'cunningham', 'toreros']],
      ['tcu', ['tcu', 'lupton', 'horned frog']],
      ['byu', ['byu', 'miller field', 'provo', 'cougar']],
      ['app-state', ['app state', 'app-state', 'beaver field', 'appalachian', 'boone']],
      ['vandy', ['vandy', 'vanderbilt', 'hawkins', 'vandyboys']],
      ['ucla', ['ucla', 'jackie robinson', 'bruin']],
      ['hs-rb', ['rancho bernardo', 'rb high', 'rb hs', 'hs-rb']],
      ['hs-corona', ['corona', 'panthers', 'hs-corona']],
      ['hs-eastlake', ['eastlake', 'chula vista', 'hs-eastlake']],
      ['hs-cchs', ['cathedral catholic', 'lynch allred', 'cchs', 'dons', 'hs-cchs']],
      ['hs-tp', ['torrey pines', 'falcons field', 'del mar heights', 'hs-tp']],
      ['hs-monte-vista', ['monte vista', 'monarchs', 'spring valley', 'hs-monte-vista']],
      ['hs-poway', ['poway', 'titan field', 'hs-poway']],
      ['hs-granite', ['granite hills', 'el cajon', 'eagles field', 'hs-granite']],
      ['hs-santana', ['santana', 'sultans', 'santee', 'hs-santana']],
      ['hs-grossmont', ['grossmont', 'gizoni', 'foothillers', 'mt helix', 'la mesa', 'hs-grossmont']],
      ['hs-valhalla', ['valhalla', 'norsemen', 'rancho san diego', 'hs-valhalla']]
    ];
    for (const [id, keys] of aliases) {
      if (keys.some((k) => low.includes(k))) return id;
    }
    return null;
  }

  function extractCageDetails(cageSummary) {
    const raw = String(cageSummary || '');
    if (!raw) return null;
    const batMatch = raw.match(/Bat:\s*([^|]+)/i);
    const parkMatch = raw.match(/Ballpark:\s*([^|]+)/i);
    const hitMatch = raw.match(/Last hit:\s*(.+)$/i);
    const evMatch = raw.match(/([\d.]+)\s*mph\s*EV/i);
    const laMatch = raw.match(/(-?[\d.]+)°\s*LA/i);
    return {
      bat: batMatch ? batMatch[1].trim() : '',
      park: parkMatch ? parkMatch[1].trim() : '',
      hit: hitMatch ? hitMatch[1].trim() : '',
      ev: evMatch ? Number(evMatch[1]) : null,
      la: laMatch ? Number(laMatch[1]) : null
    };
  }

  function buildFollowUpPrompts(topicKey, { batId = 'goods-2026', stadiumId = 'sdsu' } = {}) {
    if (topicKey === 'beginner') {
      return [
        'Give me a 10-minute tee progression to feel good contact',
        'How does Force Out vs. Tag Out work on a grounder?',
        'Which BBCOR bat swings fastest for a new player?'
      ];
    }
    if (topicKey === 'bat-drag' || topicKey === 'casting' || topicKey === 'rolling-over' || topicKey === 'lunging') {
      return [
        'Give me 2 harder tee drills for this exact flaw',
        'Why does this happen on 90+ mph or off-speed pitches?',
        'Which bat in the 3D locker helps fix my hand path?'
      ];
    }
    if (topicKey === 'infield' || topicKey === 'outfield' || topicKey === 'catcher') {
      return [
        'Give me another 5-minute glove & footwork drill',
        'Break down what to do with runners on 1st and 2nd',
        'Walk me through a practice plan for my position'
      ];
    }
    if (topicKey === 'bats') {
      const altBatMap = {
        'warstic-bonesaber': 'Compare Warstic Bonesaber Hybrid vs. 2026 The Goods',
        'stringking-metal2': 'How does StringKing Metal 2 Pro compare to Voodoo One?',
        'victus-vandal': 'Compare Victus Vandal Carbon-Cap vs. Marucci CATX2',
        'old-hickory-j143': 'Compare Old Hickory J143M vs. Baum Bat Gold wood crack'
      };
      return [
        altBatMap[batId] || 'Compare Warstic Bonesaber vs. Victus Vandal & Metal 2 Pro',
        'Why does Baum Bat Gold pop differently from Old Hickory J143M?',
        `Which bat fits my swing at ${VALID_STADIUMS[stadiumId]?.name || 'this ballpark'}?`
      ];
    }
    if (topicKey === 'stadium') {
      return [
        'Compare Grossmont Foothillers vs. Santana Sultans Field',
        'How does a 12 mph wind in change my launch angle target?',
        `Pick the best bat for ${VALID_STADIUMS[stadiumId]?.name || 'this ballpark'}`
      ];
    }
    return [
      'Analyze my last swing & exit velo cue',
      'Compare 2026 The Goods vs. Rawlings Icon & CATX2',
      'Build a 15-minute beginner or varsity cage routine'
    ];
  }

  function buildLocalJaxResponse({
    message = '',
    history = [],
    baselineSummary = '',
    baselineContext = '',
    cageSummary = '',
    cageContext = ''
  } = {}) {
    const effBase = baselineSummary || baselineContext || '';
    const effCage = cageSummary || cageContext || '';
    const msgLow = String(message || '').toLowerCase().trim();
    const baseLow = String(effBase).toLowerCase();
    const combined = `${msgLow} ${baseLow}`.trim();
    const cage = extractCageDetails(effCage);

    // Inspect prior conversation turns so Coach Jax stays conversational and NEVER repeats the same text verbatim!
    const cleanHist = Array.isArray(history) ? history : [];
    const priorJaxTexts = cleanHist
      .filter((h) => h && (h.role === 'jax' || h.role === 'model' || h.role === 'assistant') && typeof h.text === 'string')
      .map((h) => h.text);
    const priorUserTexts = cleanHist
      .filter((h) => h && h.role === 'user' && typeof h.text === 'string')
      .map((h) => h.text.toLowerCase());
    const lastJaxText = priorJaxTexts.length ? priorJaxTexts[priorJaxTexts.length - 1] : '';
    const turnCount = priorJaxTexts.length;

    const alreadySaid = (candidateReply) => {
      if (!candidateReply) return false;
      const head = candidateReply.slice(0, 68).toLowerCase();
      return priorJaxTexts.some((t) => t.toLowerCase().includes(head));
    };

    const inferPriorTopic = (txt) => {
      const low = String(txt || '').toLowerCase();
      if (/bat drag|rear elbow/.test(low)) return 'bat-drag';
      if (/casting|loops wide/.test(low)) return 'casting';
      if (/rolls? over|topspin|palm-up/.test(low)) return 'rolling-over';
      if (/lunging|changeups and sliders|front leg/.test(low)) return 'lunging';
      if (/infield defense|triangle setup|soft hands/.test(low)) return 'infield';
      if (/catcher framing|shadow-zone/.test(low)) return 'catcher';
      if (/drop-step|crow hop|outfield/.test(low)) return 'outfield';
      if (/baum bat|rawlings icon|hype fire|catx2|bonesaber|warstic|stringking|metal 2|vandal|old hickory|j143|bbcor/.test(low)) return 'bats';
      if (/ballpark scouting|altitude|windscreen|carry/.test(low)) return 'stadium';
      if (/welcome to the diamond/.test(low)) return 'beginner';
      return 'general';
    };
    const priorTopic = inferPriorTopic(lastJaxText);

    let topicKey = 'general';
    let reply = '';
    let tips = [];
    let clinicIds = [];
    let scenarioIds = [];
    let batId = 'goods-2026';
    let ytQuery = 'baseball hitting mechanics tee drills';
    let detectedStadiumId = matchStadiumMention(msgLow);

    // Explicit interactive follow-up intents ("more drills", "why", "what next", "compare", "last hit")
    const asksFollowUpDrills = /^(more\s+drills?|another\s+drill|next\s+drill|more\s+reps|more)$/.test(msgLow) || /(another drill|2 harder|more drills|extra drill)/.test(msgLow);
    const asksWhy = /^(why\??|why does that happen|explain why)/.test(msgLow) || /^why\b/.test(msgLow);
    const asksLastRep = /(last hit|last swing|current cage|analyze my|my setup|this rep)/.test(msgLow);

    // 0A. Interactive Follow-up: "last hit" / "current cage setup"
    if (asksLastRep && cage && (cage.ev || cage.bat || cage.park)) {
      topicKey = 'cage-rep';
      const evTxt = cage.ev ? `${cage.ev} mph exit velocity` : 'your live cage setup';
      const laTxt = cage.la != null ? `${cage.la}° launch angle` : 'swing angle';
      batId =
        (cage.bat.toLowerCase().includes('baum') && 'baum-gold') ||
        (cage.bat.toLowerCase().includes('old hickory') && 'old-hickory-j143') ||
        (cage.bat.toLowerCase().includes('j143') && 'old-hickory-j143') ||
        (cage.bat.toLowerCase().includes('bonesaber') && 'warstic-bonesaber') ||
        (cage.bat.toLowerCase().includes('warstic') && 'warstic-bonesaber') ||
        (cage.bat.toLowerCase().includes('stringking') && 'stringking-metal2') ||
        (cage.bat.toLowerCase().includes('metal 2') && 'stringking-metal2') ||
        (cage.bat.toLowerCase().includes('vandal') && 'victus-vandal') ||
        (cage.bat.toLowerCase().includes('icon') && 'rawlings-icon') ||
        (cage.bat.toLowerCase().includes('hype') && 'easton-hype') ||
        (cage.bat.toLowerCase().includes('catx') && 'marucci-catx2') ||
        (cage.bat.toLowerCase().includes('voodoo') && 'voodoo-one') ||
        (cage.bat.toLowerCase().includes('atlas') && 'ls-atlas') ||
        (cage.bat.toLowerCase().includes('victus') && 'victus-v243') ||
        (cage.bat.toLowerCase().includes('c271') && 'ls-c271') ||
        (cage.bat.toLowerCase().includes('rodeo') && 'combat-rodeo') ||
        (cage.bat.toLowerCase().includes('blue') && 'combat-blue') ||
        (cage.bat.toLowerCase().includes('2022') && 'goods-2022') ||
        'goods-2026';
      const highAngle = cage.la != null && cage.la > 34;
      const lowAngle = cage.la != null && cage.la < 11;
      clinicIds = lowAngle ? ['rolling-over', 'bat-drag'] : highAngle ? ['casting', 'lunging'] : ['rolling-over', 'lunging'];
      scenarioIds = ['launch-angle-exit-velo', 'xwoba-metrics'];
      ytQuery = lowAngle ? 'improve launch angle baseball line drive drill' : 'barrel control tee progression';
      const cueLine = lowAngle
        ? 'Your launch dipped under 11°—shift your PCI center 0.3 balls lower so the barrel climbs slightly through the zone (+8° to +12° attack angle).'
        : highAngle
          ? 'Your 34°+ angle steepened into fly-out territory—stay through your front hip and drive straight back toward the pitching screen to flatten to 24°–29°.'
          : 'You squared up a clean gap window! Stack 3 more straight reps while mixing pitch speeds so your stride stays on time.';
      reply = `Reviewing your live telemetry (${cage.bat || '3D Bat'} at ${cage.park || 'the ballpark'} — ${evTxt}, ${laTxt}${cage.hit ? `, ${cage.hit}` : ''}): ${cueLine}`;
      tips = [
        'Rapsodo Attack Target: Keep attack angle between +6° and +13° and Smash Factor above 1.24.',
        'Check Flight Arc Tab: Compare apex height and wind carry delta before changing swing mechanics.',
        'Next Test: Switch Pitch Speed to Varsity or Mix and aim cleanly for the opposite gap.'
      ];
    }
    // 0B. Interactive Follow-up: "more drills" / "another drill" based on prior conversation topic
    else if (asksFollowUpDrills && turnCount > 0) {
      topicKey = priorTopic;
      if (priorTopic === 'bat-drag' || priorTopic === 'casting') {
        batId = 'baum-gold';
        clinicIds = ['bat-drag', 'casting'];
        scenarioIds = ['launch-angle-exit-velo', 'xwoba-metrics'];
        reply =
          'Here is your Stage-2 progression to lock in tight hands: move past dry tee reps into constraint flips where your back shoulder stays higher than your front elbow at toe-touch. If your knob races past your belly button before your hips clear, reset and feel a slower gather with faster barrel snap out front.';
        tips = [
          'Two-Ball Timing Tee (3×8): Place two balls spaced 4 inches apart along the barrel lane—sweep through both cleanly without clipping the back ball.',
          'Offset Closed-Stance Flips (10 reps): Step 10° closed with front toe to keep ribs closed while hands fire down the inside seam.',
          'Baum Bat Wood Calibration: Take 8 manual-PCI swings in 3D against 90+ mph fastballs and track clean sweet-spot chimes.'
        ];
      } else if (priorTopic === 'infield' || priorTopic === 'outfield' || priorTopic === 'catcher') {
        batId = 'goods-2022';
        clinicIds = priorTopic === 'catcher' ? ['footwork-cadence', 'glove-stab'] : priorTopic === 'outfield' ? ['crow-hop', 'banana-route'] : ['footwork-cadence', 'glove-stab'];
        scenarioIds = priorTopic === 'outfield' ? ['relay-throw', 'tagging-up'] : ['force-vs-tag', 'stealing-second'];
        reply =
          'Let’s level up your defensive speed drills without rushing your glove: add live sound-cue cadence reps so your feet never cross awkwardly after catching. Focus on throwing with a low horizontal arrow to chest height instead of arcing slow lobs.';
        tips = [
          'Rapid Two-Ball Bounce Shuffle (3×6): Catch a short-hop roll, tap belt buckle, and fire immediately in two quick steps.',
          'Backhand Open-Hip Pick (8 reps): Stay down through the ball on forehand and backhand picks without raising your chin early.',
          'Cut-4 Callout Check: Point and vocalize the base target out loud on every throw.'
        ];
      } else {
        batId = 'easton-hype';
        clinicIds = ['rolling-over', 'lunging'];
        scenarioIds = ['launch-angle-exit-velo', 'xwoba-metrics'];
        reply =
          'Building right off our previous talk: pair high-low tee adjustments with random speed mixes so you stop muscling the ball and start letting barrel whip do the heavy work. Keep your head anchored over your belt buckle until the ball jumps off the sweet spot.';
        tips = [
          'High-Low Contrast Tee (2×10): Alternate one chest-high pitch with one shin-high pitch to build instant barrel-angle adjustability.',
          'Walk-Away Stride Check (8 swings): Freeze your finish 2 seconds after follow-through—both heels balanced means your swing plane is synced.',
          'Audition Easton Hype Fire vs. 2026 The Goods in the Bat Locker to see which MOI yields a higher Smash Factor for your timing.'
        ];
      }
    }
    // 0C. Interactive Follow-up: "why" / deeper mechanical explanation
    else if (asksWhy && turnCount > 0) {
      topicKey = priorTopic;
      batId = 'marucci-catx2';
      clinicIds = ['rolling-over', 'bat-drag'];
      scenarioIds = ['launch-angle-exit-velo', 'xwoba-metrics'];
      reply =
        'Physics-wise, exit velocity and carry come from how efficiently energy moves up the kinetic chain: ground reaction -> rear hip turn -> torso whip -> late barrel snap. Whenever arms or hands rush early, the barrel leaks wide away from your center of mass, killing rotational speed (RPM) and turning 95 mph squared line drives into weak topspin rollovers.';
      tips = [
        'Watch Smash Factor: Exit Velo / (Pitch Speed * 0.2 + Bat Speed * 1.15) spikes whenever center-of-percussion meets center-of-ball.',
        'Respect Backspin: 1,900–2,300 rpm of true backspin lifts the ball via Magnus force over deep walls.',
        'Check Inside Jam vs. Sweet Spot audio in the Bat Locker to hear why centered contact transfers full energy cleanly.'
      ];
    }
    // 1. Complete Beginner Path
    else if (
      /\b(beginner|never played|first season|total beginner|brand new|basics|3 simplest|how do i start)\b/.test(msgLow) ||
      (baseLow.includes('beginner') && !/(drag|cast|roll|lunge|stab|crow hop|banana|baum|goods|combat|icon|hype|catx)/.test(msgLow))
    ) {
      topicKey = 'beginner';
      batId = 'combat-blue';
      clinicIds = ['bat-drag', 'glove-stab'];
      scenarioIds = ['force-vs-tag', 'launch-angle-exit-velo'];
      ytQuery = 'beginner baseball hitting fielding fundamentals drills';
      reply =
        "Welcome to the diamond! Start with three simple fundamentals: (1) At the plate, set balanced feet slightly wider than shoulders, watch the pitcher's release window early, and swing slightly upward (+6° to +10° attack angle) through the middle of the ball instead of chopping down. (2) On defense, drop your hips before pitch release and catch grounders softly out in front of your glove-side eye ('triangle setup'). (3) Play crisp 20-foot partner catch every day focusing on hitting your partner's chest. Grab the Combat Members Club Blue (-3) in the 3D Stadium first—its balanced weight and extra-wide sweet spot build instant timing confidence.";
      tips = [
        'Tee Contact Drill (5 min): Hit 10 controlled middle-away line drives off a waist-high tee focusing on eyes quiet on contact.',
        'Triangle Funnel Reps (5 min): Have a partner roll 15 short grounders and absorb the hop softly toward your belly button.',
        'Pre-Pitch Checklist: Say out loud before every pitch: "Outs + Runners + Where is the Force Play?"'
      ];
    }
    // 2. Bat Drag / Jammed / Late on Fastballs
    else if (/(bat drag|drag|jam|late on fastball|elbow|hands behind|connected)/.test(combined)) {
      topicKey = 'bat-drag';
      batId = 'baum-gold';
      clinicIds = ['bat-drag', 'casting'];
      scenarioIds = ['launch-angle-exit-velo', 'xwoba-metrics'];
      ytQuery = 'fix bat drag baseball hitting drill';
      reply =
        "Late inside jams almost always trace back to bat drag—your rear elbow sliding past your belly button before your barrel turns, trapping your hands behind your ribcage. Keep your back elbow stacked cleanly behind your knob and let your belt buckle start rotation while your hands stay tight inside the ball. Test the Baum Bat Gold (-3) in the 3D cage with 'PCI: Manual' on Fastball Pro—its tighter wood-style sweet spot immediately rewards crisp inside-out timing over long loopy swings.";
      tips = [
        'Towel Under Back Armpit (3×8 swings): Dry-swing keeping a small rag pinned under your back arm until hip launch so the elbow stays connected.',
        'Fence / Net Clearance Drill (5 min): Stand a bat length from a net and swing cleanly without scraping the net to shorten your hand path.',
        'One-Hand Lead Tee Work (3×8): Drive firm line drives up the middle using only your lead arm to stop dragging the barrel.'
      ];
    }
    // 3. Casting / Sweeping Loop / Long Swing
    else if (/(cast|loop|long swing|around the ball|flare|foul ball)/.test(combined)) {
      topicKey = 'casting';
      batId = 'combat-blue';
      clinicIds = ['casting', 'bat-drag'];
      scenarioIds = ['launch-angle-exit-velo', 'xwoba-metrics'];
      ytQuery = 'stop casting baseball swing inside the ball drill';
      reply =
        "When the barrel loops wide away from your torso ('casting'), the bat arrives around the outside of the ball and slices flares or late fouls. Think 'knob straight toward the catcher's feet then up through the middle,' keeping both elbows tight until after hip fire. A lightweight, low-MOI 1-piece alloy like Combat Spec-A1 Members Club Blue lets your hands whip inside tough fastballs with ease.";
      tips = [
        'Inside Pitch Tee (3×10): Place the tee on the inner half 4 inches in front of home plate and drive clean fair line drives to the pull gap.',
        'PVC Pipe Connection (5 min): Hold a mini bat on a tight inside lane so your hands stay closer to your ribs through launch.',
        'Gap Target Rule: Aim every cage rep directly back over the pitching screen—pull power happens naturally when you are on time.'
      ];
    }
    // 4. Rolling Over / Grounders / Low Launch Angle
    else if (/(roll over|rollover|ground ball|grounder|top spin|topspin|chop|extension|wrist)/.test(combined)) {
      topicKey = 'rolling-over';
      batId = 'goods-2026';
      clinicIds = ['rolling-over', 'lunging'];
      scenarioIds = ['launch-angle-exit-velo', 'xwoba-metrics'];
      ytQuery = 'stop rolling over baseball hitting palm up palm down drill';
      reply =
        "Pull-side ground balls happen when your top hand rolls over before contact, creating topspin that dives right into the dirt. Work to keep your top hand 'palm-up' and bottom hand 'palm-down' for 8 inches past the plate so the barrel climbs slightly (+8° to +13° attack angle) and creates backspin carry. Switch to the 2026 DeMarini The Goods (-3) in the 3D Lab and watch the Rapsodo Flight Arc tab to lock in that 24°–30° launch window.";
      tips = [
        'Palm-Up Extension Hold (3×8): Stop at contact + 8 inches on a tee—check that your top wrist is still facing the sky, not rolled down.',
        'High-Tee Line Drives (3×10): Set the tee chest-high and drive flat lasers into the upper net to erase chopping angles.',
        'Opposite-Field Split (10 reps): Hit outer-third pitches into the opposite alley so your top hand stays behind the barrel.'
      ];
    }
    // 5. Lunging / Off-Speed / Changeup / Curveball / Timing
    else if (/(lunge|drift|off-speed|offspeed|changeup|curve|slider|front foot|weight transfer|timing|whiff|missed pci)/.test(combined)) {
      topicKey = 'lunging';
      batId = 'combat-rodeo';
      clinicIds = ['lunging', 'rolling-over'];
      scenarioIds = ['xwoba-metrics', 'catcher-framing'];
      ytQuery = 'stay back on off speed pitches baseball drill';
      reply =
        "Chasing changeups and sliders starts when your head and chest drift forward onto a locking front leg during stride ('lunging'). Separate your lower-half stride from your upper-body load—land softly on the inside of your front foot with weight still centered 50/50 and head behind your front hip. Jump into the 3D Studio on Pitch: Mix and practice waiting deep in the zone before committing.";
      tips = [
        'Soft-Toss Mix Timing (3×10): Have a feeder alternate firm fastballs and slow arcs so your front heel lands softly before swing launch.',
        'Walk-Through Stride (5 min): Pause 1 second at toe-touch on balanced reps to prove your head does not drift forward.',
        'Stay Tall on Breaking Stuff: Track the spin window out of the pitcher’s hand and hunt middle-away until 2 strikes.'
      ];
    }
    // 6. Infield Defense / Glove / Footwork
    else if (/(infield|glove|stab|funnel|shortstop|second base|third base|first base|grounder|footwork|exchange|double play|force)/.test(combined)) {
      topicKey = 'infield';
      batId = 'goods-2022';
      clinicIds = ['glove-stab', 'footwork-cadence'];
      scenarioIds = ['force-vs-tag', 'infield-fly', 'stealing-second'];
      ytQuery = 'infield soft hands footwork funnel drills baseball';
      reply =
        "Elite infield defense is 80% pre-pitch rhythm and soft hands out front. Creep forward as the pitcher releases, sink into a low athletic triangle with your glove touching dirt out ahead of your eyes, and funnel the hop toward your midsection using a calm 'Right—Left—Catch—Right—Throw' cadence toward 1st base. Study Force Out vs. Tag Out so your transfers never waste a split second deciding where to go.";
      tips = [
        'Barehand Roll Routine (5 min): Field 15 short hops on knees with bare hands (pinky-to-pinky funnel) to cure stabbing downward.',
        'Right-Left Bounce Step (5 min): Time your tiny split-step so your toes hit the dirt right as the ball crosses home plate.',
        'Four-Seam Transfer Reps (10 reps): Pull the ball out of the webbing with two fingers across the horseshoe seams every time.'
      ];
    }
    // 7. Outfield / Catcher / Relay / Routes / Tag Up
    else if (/(outfield|drop step|banana|route|crow hop|relay|cutoff|tag up|fly ball|catcher|framing)/.test(combined)) {
      const isCatcher = combined.includes('catcher') || combined.includes('framing');
      topicKey = isCatcher ? 'catcher' : 'outfield';
      batId = 'goods-2026';
      clinicIds = isCatcher ? ['footwork-cadence', 'glove-stab'] : ['banana-route', 'crow-hop'];
      scenarioIds = isCatcher ? ['catcher-framing', 'stealing-second'] : ['relay-throw', 'tagging-up'];
      ytQuery = isCatcher ? 'baseball catcher framing receiving drill' : 'outfield drop step crow hop relay drill';
      reply = isCatcher
        ? "Great catcher framing steals strikes quietly before the umpire blinks—start with a relaxed target under the zone and hinge slightly from the bottom up into the zone rather than jerking the mitt 6 inches inward. Pair silent bottom-edge sticks with rapid right-foot-in-front-of-left throws when runners break for 2nd base."
        : "Clean outfield play starts with your very first step: whip your back hip open at a crisp 45° drop-step immediately instead of drifting sideways in a banana curve, and sprint with your glove tucked until the final three steps. On throws to cutoffs or home, skim low across the grass with a linear crow hop so your throw stays flat on a single-hop line to the chest.";
      tips = isCatcher
        ? [
            'Short-Hop Barehand Pockets (5 min): Stick low borderline pitches quietly and hold the mitt freeze-frame for half a count.',
            'Box Footwork Pop-Time (10 reps): Replace feet quickly on the throw lane straight toward 2nd base.',
            'Shadow-Zone Discipline: Frame outer-corner pitches back toward the black edge, never dragging across the middle.'
          ]
        : [
            '45° Hip-Turn React (10 reps): Stand facing a coach, read the shoulder point left or right, and drop-step straight back before looking again.',
            'Low Skim Crow Hop (8 reps): Drive forward low over the turf—never jump straight up—and hit your cutoff’s chest.',
            'Pre-Pitch Tag Alert: Check runner speed on 3rd and wind direction before every fly ball situation.'
          ];
    }
    // 8. Bat Comparisons & Acoustics (all 16 bats incl. Warstic Bonesaber, StringKing Metal 2 Pro, Victus Vandal, Old Hickory J143M)
    else if (/(baum|victus|v243|vandal|c271|old hickory|hickory|j143|voodoo|atlas|goods|combat|rodeo|catx2|marucci|rawlings|icon|easton|hype|warstic|bonesaber|stringking|metal 2|metal2|composite|bat|wood|alloy|bbcor|ping|pop|sweet spot|moi)/.test(combined)) {
      topicKey = 'bats';
      batId =
        (combined.includes('bonesaber') || combined.includes('warstic') ? 'warstic-bonesaber' : '') ||
        (combined.includes('stringking') || combined.includes('metal 2') || combined.includes('metal2') ? 'stringking-metal2' : '') ||
        (combined.includes('vandal') ? 'victus-vandal' : '') ||
        (combined.includes('old hickory') || combined.includes('hickory') || combined.includes('j143') ? 'old-hickory-j143' : '') ||
        (combined.includes('icon') || combined.includes('rawlings') ? 'rawlings-icon' : '') ||
        (combined.includes('hype') || combined.includes('easton') ? 'easton-hype' : '') ||
        (combined.includes('baum') && 'baum-gold') ||
        (combined.includes('victus') && 'victus-v243') ||
        (combined.includes('c271') && 'ls-c271') ||
        (combined.includes('voodoo') && 'voodoo-one') ||
        (combined.includes('atlas') && 'ls-atlas') ||
        (combined.includes('rodeo') && 'combat-rodeo') ||
        (combined.includes('combat') && 'combat-blue') ||
        (combined.includes('catx') && 'marucci-catx2') ||
        'goods-2026';
      clinicIds = ['rolling-over', 'bat-drag'];
      scenarioIds = ['launch-angle-exit-velo', 'xwoba-metrics'];
      ytQuery = 'bbcor composite vs alloy baseball bat comparison bonesaber vandal metal 2 catx2';
      reply =
        batId === 'warstic-bonesaber'
          ? 'Warstic Bonesaber Hybrid (-3) pairs a Katana2X alloy barrel with a composite handle and Tsuka-Warrior pommel—giving you blazing speed-loaded barrel whip and a crisp, razor-edged alloy ping without heavy end-load drag.'
          : batId === 'stringking-metal2'
            ? 'StringKing Metal 2 Pro (-3) is an ultra-lightweight raw 1-piece alloy stick engineered for pure whip and top-of-zone fastballs, producing an unmistakable glassy high-register metallic ring when squared cleanly.'
            : batId === 'victus-vandal'
              ? 'Victus Vandal (-3) combines a stealth matte-black VXP 1-piece alloy barrel with a hollow carbon composite end cap—dropping swing weight toward your hands for quick whip and a punchy, damped alloy knock.'
              : batId === 'old-hickory-j143'
                ? 'Old Hickory J143M (-3 Pro Maple) turns a dense, flame-tempered chestnut barrel into an end-loaded maple profile with an intense dry hardwood crack—ideal for training heavy-barrel carry vs. Baum Bat Gold’s PermaWood pop.'
                : batId === 'rawlings-icon'
                  ? 'Rawlings Icon (-3 Composite) uses In/Tense Carbon Composite walls that deliver a deep, muted carbon thud instead of a bright metallic ring, with a huge zero-loss sweet spot and smooth balanced whip through the zone.'
                  : batId === 'easton-hype'
                    ? 'Easton Hype Fire (-3 Thermo-Composite) pairs a flexible ConneXion Max joint with a hollow trampoline composite barrel that produces a crisp, snappy carbon whack and blazing bat speed.'
                    : batId === 'marucci-catx2'
                      ? 'Marucci CATX2 (-3 AZR Alloy) blends a classic clean high-pitched AZR alloy bell ring with a Liquid-Gel dampened knob—so squared barrels ring loudly without stinging your bottom hand on cool mornings.'
                      : batId === 'baum-gold'
                        ? 'Baum Bat Gold (-3 PermaWood Composite) adds a dense interior wood-composite cavity pop layered beneath a crisp maple crack—giving you true pro wood durability plus unmistakable barrel pop when you find the sweet spot.'
                        : "All 16 bats in the DiamondIQ Locker carry distinct mass, MOI, and acoustics: Pro Wood (Baum Bat Gold, Victus V243, LS Prime C271, Old Hickory J143M), Hybrids (DeMarini Goods '26/'22, Warstic Bonesaber), Composite BBCOR (Rawlings Icon, Easton Hype Fire), and 1-Pc Alloys (Voodoo One, Atlas EVO-K, StringKing Metal 2 Pro, Combat Rodeo/Blue, Marucci CATX2, Victus Vandal).";
      tips = [
        'Audition Contact Zones: Compare Sweet Spot, End Cap, Inside Jam, and Foul Glance right inside the Bat Locker audio lab.',
        'Speed-Loaded vs. End-Loaded: Try Warstic Bonesaber, StringKing Metal 2 Pro, or Victus Vandal against heavy end-loads like The Goods \'26 or Old Hickory J143M.',
        'Check Smash Factor: Target 1.24–1.30 in Rapsodo telemetry to verify pure sweet-spot transfer.'
      ];
    }
    // 9. Specific Stadium / Weather / Wind / Ballpark Scouting (incl. East County HS!)
    else if (detectedStadiumId || /(stadium|field|ballpark|wind|altitude|wall|monster|rapsodo|exit velo|launch angle|statcast|east county|san diego)/.test(combined)) {
      topicKey = 'stadium';
      const stId = detectedStadiumId || 'sdsu';
      const park = VALID_STADIUMS[stId];
      detectedStadiumId = stId;
      batId = stId === 'fenway' || stId === 'vandy' || stId === 'yankee' ? 'goods-2026' : stId.startsWith('hs-') ? 'easton-hype' : 'goods-2022';
      clinicIds = ['rolling-over', 'casting'];
      scenarioIds = ['launch-angle-exit-velo', 'xwoba-metrics'];
      ytQuery = 'launch angle exit velocity spray chart hitting approach';
      reply = `Ballpark Scouting — ${park.name} (${park.dims}): ${park.note} Use the Launch Angle (~24°–30° for HRs, 10°–20° for gap line drives) and Wind toggles in the 3D Studio to test how flies carry over this exact wall.`;
      tips = [
        'Test Carry vs. Wind: Toggle 10 Out vs. 12 In wind in Rapsodo Flight Arc to see 15–28 ft carry swings firsthand.',
        'Hunt 26°–30° Barrels: Press "Demo High HR" or aim slightly under middle fastballs with Manual PCI for ideal backspin.',
        'Play the Park: Shorten up with two strikes toward open gaps rather than forcing steep uppercuts into deep CF.'
      ];
    }
    // 10. General / Catch-All Baseball Coaching
    else {
      topicKey = 'general';
      batId = turnCount % 2 === 1 ? 'rawlings-icon' : 'goods-2026';
      clinicIds = ['rolling-over', 'glove-stab'];
      scenarioIds = ['force-vs-tag', 'launch-angle-exit-velo'];
      ytQuery = 'complete baseball hitting and fielding practice drills';
      reply =
        turnCount > 0 && cage && (cage.bat || cage.park)
          ? `Checking in on your session (${cage.bat || 'Selected Bat'} at ${cage.park || 'the ballpark'}): dial in one simple focus for your next 5 reps—either landing softly on time at toe-touch or holding palm-up/palm-down extension past contact. Tell me whether you want a swing drill, bat comparison, or East County field scouting report next.`
          : "Let's keep your training sharp and practical! Great baseball comes down to timing your load early at the plate, catching the ball out in front of your glove-side hip on defense, and knowing where every throw goes before the pitch is thrown. Pick any specific topic—like Rawlings Icon vs. CATX2, bat drag, Santana/Grossmont/Valhalla HS fields, or a beginner checkup—and I'll build your next step.";
      tips = [
        '10-Min Tee Calibration: 5 swings up the middle + 5 swings to the opposite gap before stepping into live speed.',
        'Pre-Pitch Mental Rep: Check outs, baserunners, and wind before every single pitch in the 3D Stadium.',
        'Run the 28-Q Baseline: Visit Training Lab -> 28-Q Baseline Quiz to lock in your honest profile.'
      ];
    }

    // Anti-repetition guard: cycle through genuinely distinct angles if the same topic comes back around!
    if (alreadySaid(reply)) {
      const cageTag = cage && (cage.ev || cage.bat) ? ` [${cage.bat || 'Cage'}${cage.ev ? ` · ${cage.ev} mph EV` : ''}]` : '';
      const angles = [
        `Progression Check (Turn ${turnCount + 1}${cageTag}): Move from single-speed reps into live Mix mode—track spin axis out of the hand and stay palm-up/palm-down through the middle third.`,
        `Acoustic & Barrel Feedback (Turn ${turnCount + 1}${cageTag}): Compare your swing against ${VALID_BATS[batId] || 'your gamer bat'} in Manual PCI mode—if you hear jam/endcap damping, shorten your gather by 15%.`,
        `Launch Window Tune-Up (Turn ${turnCount + 1}${cageTag}): Aim for 14°–24° line drives up the big part of ${VALID_STADIUMS[detectedStadiumId || 'sdsu']?.name || 'the yard'} before hunting pull-side elevation.`
      ];
      reply = `${angles[turnCount % angles.length]} ${tips[turnCount % Math.max(1, tips.length)] || ''}`.trim();
    }

    const cleanClinicIds = clinicIds.filter((id, i, a) => VALID_CLINICS[id] && a.indexOf(id) === i).slice(0, 2);
    const cleanScenarioIds = scenarioIds.filter((id, i, a) => VALID_SCENARIOS[id] && a.indexOf(id) === i).slice(0, 2);

    const videoLinks = cleanClinicIds.map((id) => ({
      clinicId: id,
      title: VALID_CLINICS[id].title,
      domain: VALID_CLINICS[id].domain,
      url: `training.html?clinic=${encodeURIComponent(id)}#video-clinic-section`
    }));

    const recommendedScenarios = cleanScenarioIds.map((id) => ({
      scenarioId: id,
      title: VALID_SCENARIOS[id],
      url: `detail.html?id=${encodeURIComponent(id)}`
    }));

    const youtubeLinks = [
      ...cleanClinicIds.map((id) => VALID_CLINICS[id].youtube).filter(Boolean),
      {
        label: `Search YouTube: ${ytQuery}`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(ytQuery)}`
      }
    ].slice(0, 3);

    const followUpPrompts = buildFollowUpPrompts(topicKey, {
      batId: VALID_BATS[batId] ? batId : 'goods-2026',
      stadiumId: detectedStadiumId || 'sdsu'
    }).filter((p) => !priorUserTexts.includes(p.toLowerCase()));

    return {
      coach: 'Jax',
      source: 'instant-local',
      mode: 'local-scouting',
      reply,
      actionableTips: tips.slice(0, 3),
      videoLinks,
      recommendedScenarios,
      youtubeLinks,
      webSources: [],
      recommendedBatId: VALID_BATS[batId] ? batId : 'goods-2026',
      recommendedBatName: VALID_BATS[batId] || VALID_BATS['goods-2026'],
      followUpPrompts: followUpPrompts.slice(0, 3)
    };
  }

  return {
    VALID_CLINICS,
    VALID_BATS,
    VALID_SCENARIOS,
    VALID_STADIUMS,
    isValidGeminiKey,
    parseDelimitedJaxResponse,
    buildFollowUpPrompts,
    buildLocalJaxResponse
  };
});
