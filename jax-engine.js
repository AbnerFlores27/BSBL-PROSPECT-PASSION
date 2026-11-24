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
    'goods-2026': '2026 DeMarini The Goods (Ice Blue/Black/Red Hybrid -3)',
    'goods-2022': '2022 DeMarini The Goods (Chrome Silver/Black Hybrid -3)',
    'combat-rodeo': 'Combat MFG Spec-A1 Rodeo (Cream/Maroon 1-Pc Alloy -3)',
    'combat-blue': 'Combat Spec-A1 Members Club Blue (Powder Blue 1-Pc Alloy -3)',
    'marucci-catx2': 'Marucci CATX2 Alloy (Silver/Red AZR 1-Pc Liquid-Gel -3)'
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
    sdsu: { name: 'Tony Gwynn Stadium (SDSU)', tier: 'college', dims: '340 LF · 410 CF · 340 RF', note: 'Spacious 410-ft center gap rewards crisp line drives and gap-to-gap speed over lazy fly balls.' },
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
    cage: { name: 'D1 Rapsodo Lab (Indoor)', tier: 'cage', dims: '400 FT Simulated Net', note: 'Focus purely on barrel contact zone, smash factor, attack angle (+6° to +12°), and spin efficiency.' }
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
      const matched = trimmed.match(/^\*{0,2}(REPLY|TIPS|CLINICS|SCENARIOS|BAT|YOUTUBE_TOPICS)\*{0,2}\s*:\s*(.*)$/i);
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

    return {
      reply,
      tips,
      clinicTokens,
      scenarioTokens,
      batId: batTokens.find((b) => VALID_BATS[b]) || 'goods-2026',
      ytTopics
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
      ['hs-eastlake', ['eastlake', 'chula vista', 'titans', 'hs-eastlake']]
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

  function buildLocalJaxResponse({ message = '', baselineSummary = '', cageSummary = '', playerProfile = null } = {}) {
    const msgLow = String(message || '').toLowerCase();
    const baseLow = String(baselineSummary || '').toLowerCase();
    const combined = `${msgLow} ${baseLow}`.trim();
    const cage = extractCageDetails(cageSummary);

    let reply = '';
    let tips = [];
    let clinicIds = [];
    let scenarioIds = [];
    let batId = 'goods-2026';
    let ytQuery = 'baseball hitting mechanics tee drills';

    const stadiumHitId = matchStadiumMention(msgLow);

    // 1. Complete Beginner Path
    if (
      /\b(beginner|never played|first season|total beginner|brand new|basics|3 simplest|how do i start)\b/.test(msgLow) ||
      (baseLow.includes('beginner') && !/(drag|cast|roll|lunge|stab|crow hop|banana|baum|goods|combat)/.test(msgLow))
    ) {
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
    // 8. Bat Comparisons & Acoustics
    else if (/(baum|goods|combat|rodeo|catx2|marucci|bat|wood|alloy|bbcor|ping|pop|sweet spot|moi)/.test(combined)) {
      batId = combined.includes('baum') ? 'baum-gold' : combined.includes('combat') ? 'combat-rodeo' : combined.includes('catx2') ? 'marucci-catx2' : 'goods-2026';
      clinicIds = ['rolling-over', 'bat-drag'];
      scenarioIds = ['launch-angle-exit-velo', 'xwoba-metrics'];
      ytQuery = 'bbcor bat comparison tree goods baum wood swing weight';
      reply =
        "Every bat in the DiamondIQ Locker has distinct mass, MOI (Moment of Inertia — how heavy the barrel feels through the zone), and barrel sound: Baum Bat Gold (-3) is a dense maple-composite PermaWood with an honest 2.505\" sweet spot and dry crack + short woody barrel pop; 2026 & 2022 DeMarini The Goods pair heavy end-loaded X14 alloy barrels with composite handles for max Statcast exit velo and crisp two-piece pings; Combat Spec-A1 (Rodeo / Members Blue) & Marucci CATX2 are responsive 1-piece alloys with lower swing weight and wider sweet spots for catch-up bat speed.";
      tips = [
        'Audition Contact Zones: Use the "Sweet Spot / End Cap / Inside Jam / Foul Glance" buttons under the Bat Locker to hear real barrel feedback.',
        'Match Bat to Goal: Pick Baum Bat Gold to groove inside mechanics; pick 2026 Goods for max carry; pick Combat Blue for elite bat speed.',
        'Check Smash Factor: Aim for 1.24–1.30 smash factor in Rapsodo telemetry to verify pure barrel efficiency.'
      ];
    }
    // 9. Specific Stadium / Weather / Wind / Ballpark Scouting
    else if (stadiumHitId || /(stadium|field|ballpark|wind|altitude|wall|monster|rapsodo|exit velo|launch angle|statcast)/.test(combined)) {
      const park = VALID_STADIUMS[stadiumHitId || 'sdsu'];
      batId = stadiumHitId === 'fenway' || stadiumHitId === 'vandy' || stadiumHitId === 'yankee' ? 'goods-2026' : 'goods-2022';
      clinicIds = ['rolling-over', 'casting'];
      scenarioIds = ['launch-angle-exit-velo', 'xwoba-metrics'];
      ytQuery = 'launch angle exit velocity spray chart hitting approach';
      reply = `Ballpark Scouting — ${park.name} (${park.dims}): ${park.note} Use the Launch Angle (~24°–30° for HRs, 10°–20° for gap line drives) and Wind toggles in the 3D Studio to see exactly how your batted balls carry into alleys vs. tall walls.`;
      tips = [
        'Test Carry vs. Wind: Toggle 10 Out vs. 12 In wind in Rapsodo Flight Arc to see 15–28 ft carry swings firsthand.',
        'Hunt 26°–30° Barrels: Press "Demo High HR" or aim slightly under middle fastballs with Manual PCI for ideal backspin.',
        'Play the Park: Shorten up with two strikes toward open gaps rather than forcing steep uppercuts into deep CF.'
      ];
    }
    // 10. Live Cage Telemetry Follow-up (e.g. "Analyze my current cage setup" or "I just hit a...")
    else if (cage && (cage.ev || cage.bat)) {
      const evTxt = cage.ev ? `${cage.ev} mph exit velocity` : 'your current rep';
      const laTxt = cage.la != null ? `${cage.la}° launch angle` : 'swing plane';
      batId = (cage.bat.toLowerCase().includes('baum') && 'baum-gold') ||
        (cage.bat.toLowerCase().includes('rodeo') && 'combat-rodeo') ||
        (cage.bat.toLowerCase().includes('blue') && 'combat-blue') ||
        (cage.bat.toLowerCase().includes('catx') && 'marucci-catx2') ||
        (cage.bat.toLowerCase().includes('2022') && 'goods-2022') ||
        'goods-2026';
      const highAngle = cage.la != null && cage.la > 35;
      const lowAngle = cage.la != null && cage.la < 10;
      clinicIds = lowAngle ? ['rolling-over', 'bat-drag'] : highAngle ? ['casting', 'lunging'] : ['rolling-over', 'lunging'];
      scenarioIds = ['launch-angle-exit-velo', 'xwoba-metrics'];
      ytQuery = lowAngle ? 'improve baseball launch angle backspin line drives' : 'consistent baseball barrel path tee drills';
      reply = `Looking at your live 3D Studio setup (${cage.bat || 'Selected Bat'} at ${cage.park || 'the ballpark'} — ${evTxt}, ${laTxt}): ${
        lowAngle
          ? 'Your launch angle dipped below 10°, meaning the barrel arrived slightly on top of the ball. Aim the lower third of your PCI slightly beneath the baseball (+8° to +12° attack angle) and keep your top palm facing up past contact to turn grounders into carrying line drives.'
          : highAngle
            ? 'Your launch angle climbed past 35° (sky-high fly / pop territory). Stay taller through your front side and meet the pitch out front cleanly at 22°–29° so energy transfers forward into the gaps instead of straight up.'
            : 'That swing plane sits right in the sweet-spot zone! Repeat that clean hip-first turn with quiet head tracking so you stack back-to-back 95+ mph line drives across all pitch speeds.'
      }`;
      tips = [
        'Dial In Attack Angle: Watch the Rapsodo Attack Angle readout right below the 3D field—target +6° to +13° on level strikes.',
        'Switch Spray vs. Flight Arc: Check the Flight Arc tab after each swing to see wall clearance and apex height.',
        'Mix Off-Speed: Switch Pitch from Fastball to Mix once you barrel 3 straight pitches.'
      ];
    }
    // 11. General / Catch-All Baseball Coaching
    else {
      batId = 'goods-2026';
      clinicIds = ['rolling-over', 'glove-stab'];
      scenarioIds = ['force-vs-tag', 'launch-angle-exit-velo'];
      ytQuery = 'complete baseball hitting and fielding practice drills';
      reply =
        "Let's keep your training sharp and simple! Great baseball comes down to timing your load early at the plate, catching the ball out in front of your glove-side hip on defense, and knowing where every throw goes before the pitch is thrown. Pick any specific issue—like bat drag, rolling over grounders, throwing accuracy, beginner setup, or a stadium approach—and I'll build your exact step-by-step fix.";
      tips = [
        '10-Min Tee Calibration: 5 swings up the middle + 5 swings to the opposite gap before stepping into live speed.',
        'Pre-Pitch Mental Rep: Check outs, baserunners, and wind before every single pitch in the 3D Stadium.',
        'Run the 28-Q Baseline: Visit Training Lab -> 28-Q Baseline Quiz to lock in your honest profile without guessing.'
      ];
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

    return {
      coach: 'Jax',
      mode: 'local-scouting',
      reply,
      actionableTips: tips.slice(0, 3),
      videoLinks,
      recommendedScenarios,
      youtubeLinks,
      webSources: [],
      recommendedBatId: VALID_BATS[batId] ? batId : 'goods-2026',
      recommendedBatName: VALID_BATS[batId] || VALID_BATS['goods-2026']
    };
  }

  return {
    VALID_CLINICS,
    VALID_BATS,
    VALID_SCENARIOS,
    VALID_STADIUMS,
    isValidGeminiKey,
    parseDelimitedJaxResponse,
    buildLocalJaxResponse
  };
});
