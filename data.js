/* DiamondIQ — 8 Seeded Baseball Scenarios, 5-Expert Panel Content & Daily Fun Facts
   Shared between Node.js server/seed layer and browser client. */
(function (root) {
  const DIAMONDIQ_DATA = {
    openingDayIso: '2027-03-25T13:05:00-04:00',

    funFacts: [
      'A regulation MLB baseball has exactly 108 double stitches of red waxed thread.',
      'Statcast tracks every batted ball at 30 frames per second using optical cameras around the ballpark.',
      'The Infield Fly Rule was added in 1895 to stop infielders from intentionally dropping pop-ups for easy double plays.',
      'A runner stealing second base typically needs a jump-and-sprint time under 3.4 seconds to beat an average catcher pop time.',
      'Exit velocity over 95 mph combined with a launch angle between 8 and 32 degrees is classified as a "sweet-spot" hit.',
      'Catcher framing can swing roughly 10 to 15 runs of value per season by keeping borderline pitches looking steady in the zone.'
    ],

    expertsMeta: [
      { id: 'coach', name: 'Youth Baseball Coach', role: 'Rules & Fundamentals' },
      { id: 'analyst', name: 'Sabermetrics Analyst', role: 'Statcast & Probability' },
      { id: 'dev', name: 'Web Dev Mentor', role: 'Architecture & Data' },
      { id: 'designer', name: 'UI/UX Designer', role: 'Clarity & Visual Hierarchy' },
      { id: 'rookie', name: 'Rookie Player', role: 'Plain-English Takeaway' }
    ],

    scenarios: [
      {
        id: 'force-vs-tag',
        title: 'Force Out vs. Tag Out',
        category: 'fundamental',
        categoryLabel: 'Fundamental',
        difficulty: 2,
        popularity: 98,
        shortSummary: 'Two ways to record an out: step on the forced base with the ball, or tag the runner directly.',
        quickTakeaway: 'When a runner has to advance because the batter became a runner, touching the base before they arrive is a force out. Once that force is removed—or when the runner can stay put—you must tag the runner.',
        keyRule: 'MLB Rule 5.09(b)(6): A force play ends the moment a following runner is put out.',
        meters: {
          difficulty: { score: 2, tier: 'Low', note: 'Clear once you check whether the base behind is occupied.' },
          risk: { score: 1, tier: 'Low', note: 'Taking the guaranteed force out minimizes throwing errors.' },
          impact: { score: 3, tier: 'High', note: 'Dictates double-play timing and prevents extra runners advancing.' }
        },
        diagram: {
          caption: 'Runner on 1st must run to 2nd on a grounder—fielders only need to touch 2nd base.',
          runners: ['1st', 'home'],
          ballPath: ['home', 'shortstop', '2nd'],
          highlightBase: '2nd',
          callout: 'Force at 2nd: step on bag'
        },
        experts: {
          coach: 'Before every pitch, ask yourself: "Is there an open base behind the runner?" With a runner on 1st and nobody out, the batter forces the runner to 2nd—just catch and touch the bag. If 1st is empty, the runner on 2nd is NOT forced, so you must tag them.',
          analyst: 'Choosing the sure force out at 2nd rather than attempting a rushed tag or tough cross-body throw protects Run Expectancy. Turning a force into an out with runners on 1st and 2nd drops expected runs in the inning by roughly 45%.',
          dev: 'Think of a force play as a boolean state derived from base occupancy: isForced = allPreviousBasesOccupied(). Each scenario row stores base states cleanly in PostgreSQL so the UI updates the field diagram without duplicating rules.',
          designer: 'Notice how the diagram highlights the target base in powder blue rather than cluttering every infield position. Beginners scan where the ball goes first, then see the rule label.',
          rookie: 'My easy cheat code: if the runner behind you is pushing you off your base, the fielder only needs to touch the bag. If nobody is pushing you, they have to tag you with the ball.'
        },
        trivia: {
          question: 'Runners are on 1st and 3rd with one out. The batter hits a grounder to the shortstop. Which bases have a force play?',
          options: [
            '1st base and 2nd base only',
            'Home plate and 3rd base',
            'All four bases',
            'Only 1st base'
          ],
          correctIndex: 0,
          explanation: 'The runner on 3rd has an open base behind them (2nd is empty), so they are NOT forced home. Only the batter (to 1st) and the runner on 1st (to 2nd) are forced.'
        }
      },
      {
        id: 'infield-fly',
        title: 'Infield Fly Rule Basics',
        category: 'fundamental',
        categoryLabel: 'Fundamental',
        difficulty: 4,
        popularity: 91,
        shortSummary: 'Protects baserunners when an infielder could intentionally drop an easy pop-up for a cheap double play.',
        quickTakeaway: 'With fewer than 2 outs and runners on 1st and 2nd (or bases loaded), an easy pop-up to an infielder automatically makes the batter out. Runners can stay safely on their bases.',
        keyRule: 'Requires < 2 outs, runners on 1st & 2nd (or loaded), and ordinary effort by an infielder.',
        meters: {
          difficulty: { score: 3, tier: 'High', note: 'Umpire judgment call on "ordinary effort" confuses new fans.' },
          risk: { score: 2, tier: 'Medium', note: 'Runners risk getting doubled off if they stray too far.' },
          impact: { score: 3, tier: 'High', note: 'Stops defenses from turning a free pop-up into two force outs.' }
        },
        diagram: {
          caption: 'Runners on 1st & 2nd, < 2 outs: pop-up to shortstop triggers automatic batter out.',
          runners: ['1st', '2nd'],
          ballPath: ['home', 'shortstop'],
          highlightBase: 'home',
          callout: 'Batter OUT immediately'
        },
        experts: {
          coach: 'Listen for the umpire shouting "Infield fly, if fair!" Once called, the batter is out whether the ball is caught or dropped. Runners should freeze near their bases so they do not get tagged out.',
          analyst: 'Without this rule, an infielder facing runners on 1st and 2nd could let a pop-up bounce and turn a 6-4-3 double play almost 90% of the time, artificially inflating defensive win probability.',
          dev: 'Notice the multi-condition guard: outs < 2 && onFirst && onSecond && isOrdinaryInfieldFly. Storing explicit preconditions in our data model keeps quiz explanations tied directly to the rule logic.',
          designer: 'Grouping the three preconditions as a short checklist helps beginners verify the rule in three seconds instead of reading a wall of rulebook prose.',
          rookie: 'At first I wondered why the batter was out even when the ball hit the grass! Now it makes sense: it stops fielders from faking a drop to trap runners.'
        },
        trivia: {
          question: 'Can the Infield Fly Rule be called when there is only ONE runner on 1st base and zero outs?',
          options: [
            'No — runners must be on at least 1st and 2nd base',
            'Yes — any pop-up with a runner on 1st counts',
            'Yes — as long as there are two outs',
            'Only if the pitcher catches the ball'
          ],
          correctIndex: 0,
          explanation: 'With only a runner on 1st, the defense can only get one easy force out even if they drop the ball, so the Infield Fly Rule does not apply.'
        }
      },
      {
        id: 'stealing-second',
        title: 'Stealing Second Base Timing',
        category: 'fundamental',
        categoryLabel: 'Fundamental',
        difficulty: 3,
        popularity: 89,
        shortSummary: 'Beating the throw comes down to pitcher delivery time, your lead-off, and catcher pop time.',
        quickTakeaway: 'A successful steal happens before the catcher even throws: reading the pitcher’s first move buys crucial tenths of a second. Combined pitcher delivery + catcher pop time usually needs to beat 3.35 seconds.',
        keyRule: 'Break-even stolen base success rate in modern baseball is roughly 75% to 78%.',
        meters: {
          difficulty: { score: 2, tier: 'Medium', note: 'Requires reading hip/heel cues without getting picked off.' },
          risk: { score: 3, tier: 'High', note: 'Getting caught erases a baserunner and adds an out.' },
          impact: { score: 2, tier: 'Medium', note: 'Moves a runner into scoring position for a single.' }
        },
        diagram: {
          caption: 'Runner breaks from 1st on pitcher’s first movement while catcher pops to 2nd.',
          runners: ['1st'],
          ballPath: ['pitcher', 'home', '2nd'],
          highlightBase: '2nd',
          callout: 'Pop time race to 2nd'
        },
        experts: {
          coach: 'Watch the pitcher’s front heel or back hip—once that weight commits toward home plate, explode! Keep your eyes on the shortstop or second baseman as you slide so you know which side of the bag to reach for.',
          analyst: 'Steal math is a race against 3.4 seconds: ~1.35s pitcher delivery to plate plus ~1.95s catcher pop time. If a runner’s sprint + jump beats 3.30s, their expected steal rate climbs above 80%.',
          dev: 'Time-series values like delivery (1.35s) and pop time (1.95s) should always render with tabular-nums monospace alignment so users can compare tenths of a second cleanly.',
          designer: 'Separating "Pitcher Time" and "Catcher Time" into crisp visual tiers lets a beginner immediately grasp why a slow pitcher makes stealing easy even against a strong-armed catcher.',
          rookie: 'I used to think stealing was just about being the fastest runner, but getting a great jump off the pitcher matters just as much!'
        },
        trivia: {
          question: 'If a pitcher takes 1.45s to reach home and the catcher has a 2.00s pop time, how fast must the runner reach 2nd base to be safe?',
          options: [
            'Under 3.45 seconds',
            'Under 2.00 seconds',
            'Under 4.50 seconds',
            'Exactly 3.80 seconds'
          ],
          correctIndex: 0,
          explanation: 'Total defensive time is 1.45s + 2.00s = 3.45s. Anything faster than 3.45s beats the tag.'
        }
      },
      {
        id: 'launch-angle-exit-velo',
        title: 'Reading Launch Angle & Exit Velocity',
        category: 'analytics',
        categoryLabel: 'Analytics',
        difficulty: 3,
        popularity: 94,
        shortSummary: 'How hard (mph) and how high (degrees) a ball leaves the bat predicts hits far better than box-score luck.',
        quickTakeaway: 'Exit velocity measures raw ball speed off the bat, while launch angle measures vertical trajectory. Pairing 98+ mph exit velocity with a 25°–30° launch angle produces the famous Statcast "Barrel."',
        keyRule: 'Statcast Barrel zone starts at 98 mph exit velocity and 26°–30° launch angle.',
        meters: {
          difficulty: { score: 2, tier: 'Medium', note: 'Two numbers to read together instead of one batting average.' },
          risk: { score: 1, tier: 'Low', note: 'Purely observational metric for evaluating hitter quality.' },
          impact: { score: 3, tier: 'High', note: 'Separates lucky bloop singles from sustainable power.' }
        },
        diagram: {
          caption: 'Optimal 10°–30° trajectory carries line drives and deep fly balls past defenders.',
          runners: ['home'],
          ballPath: ['home', 'outfield'],
          highlightBase: 'outfield',
          callout: 'Barrel Zone: 98+ mph · 26°–30°'
        },
        experts: {
          coach: 'We tell young hitters not to swing straight up for home runs—aim for line drives up the middle (10° to 20°). Hard-hit line drives find gaps consistently and still turn into doubles and homers as you grow stronger.',
          analyst: 'A 105 mph grounder at -5° hits right into an infielder’s glove most of the time (~.240 BA), while 105 mph at 24° produces a batting average north of .750 and slugging over 2.400.',
          dev: 'Both metrics use clean continuous ranges (mph and deg). Keeping unit labels visible right next to values prevents beginners from confusing launch angle with spray angle.',
          designer: 'Using structured stat meters with explicit Low / Medium / High labels makes Statcast feel approachable instead of an intimidating spreadsheet.',
          rookie: 'Now when a broadcast flashes "104 mph, 27°", I know right away that ball was crushed at the exact sweet spot.'
        },
        trivia: {
          question: 'Which batted ball is most likely to become an extra-base hit or home run?',
          options: [
            '103 mph exit velocity at a 26° launch angle',
            '103 mph exit velocity at a -8° launch angle',
            '76 mph exit velocity at a 52° launch angle',
            '82 mph exit velocity at a 0° launch angle'
          ],
          correctIndex: 0,
          explanation: '103 mph at 26° sits squarely inside the Statcast Barrel window—high exit velocity paired with ideal carry.'
        }
      },
      {
        id: 'catcher-framing',
        title: 'Catcher Framing Fundamentals',
        category: 'fundamental',
        categoryLabel: 'Fundamental',
        difficulty: 4,
        popularity: 82,
        shortSummary: 'Subtle, quiet glove work that keeps borderline pitches looking like strikes when they cross the plate.',
        quickTakeaway: 'Great framing is NOT jerking the glove six inches after the catch. It means setting a quiet low target and beating the ball to the spot so your thumb and wrist stay firm at impact.',
        keyRule: 'Borderline pitches within one ball-width of the strike zone edge drive framing value.',
        meters: {
          difficulty: { score: 3, tier: 'High', note: 'Requires soft hands and rapid pitch recognition at 90+ mph.' },
          risk: { score: 2, tier: 'Medium', note: 'Over-yanking the glove tips off the umpire.' },
          impact: { score: 3, tier: 'High', note: 'Elite framers steal 10–15 runs per season for their pitching staff.' }
        },
        diagram: {
          caption: 'Receiving from below the ball keeps the glove steady inside the strike zone frame.',
          runners: ['home'],
          ballPath: ['pitcher', 'home'],
          highlightBase: 'home',
          callout: 'Quiet wrist at zone edge'
        },
        experts: {
          coach: 'Start with your glove relaxed below the target and work upward through the bottom of the ball. If your elbow drops or you stab downward, even a true strike can look like a ball to the plate umpire.',
          analyst: 'Called-strike probability on the bottom shadow of the zone jumps from ~42% with an average receiver to ~55% with an elite framer—turning walks into strikeouts over 162 games.',
          dev: 'Notice how framing connects mechanics to analytics: we store both a Coach cue and a Sabermetrics metric on the same scenario entity so learners see both sides together.',
          designer: 'Keeping the expert breakdown inside expandable <details> cards lets readers scan the 5 perspectives without scrolling through a 2,000-word wall of text.',
          rookie: 'I always thought umpires only looked at where the ball crossed, but catching it smoothly actually helps them see the strike clearly.'
        },
        trivia: {
          question: 'What is the biggest mistake beginners make when trying to frame a low borderline pitch?',
          options: [
            'Stabbing downward or aggressively yanking the glove upward afterward',
            'Starting the glove slightly below the target',
            'Keeping their head and chest quiet',
            'Catching the ball out in front of the body'
          ],
          correctIndex: 0,
          explanation: 'Big, sudden glove pulls signal to the umpire that the pitch was actually a ball. Quiet, upward-moving hands win the call.'
        }
      },
      {
        id: 'relay-throw',
        title: 'Executing a Relay Throw',
        category: 'fundamental',
        categoryLabel: 'Fundamental',
        difficulty: 3,
        popularity: 85,
        shortSummary: 'How the outfielder, cutoff man, and infielder align to turn a deep gap hit into a crisp throw home.',
        quickTakeaway: 'Two accurate, quick throws beat one long rainbow heave every time. The cutoff infielder lines up between the ball and target base, arms raised, listening to the base-covering teammate for "Cut!" or "Let it go!"',
        keyRule: 'Align on a straight line from the outfielder to the target base; keep throws chest-high.',
        meters: {
          difficulty: { score: 2, tier: 'Medium', note: 'Requires communication across 250+ feet of grass.' },
          risk: { score: 2, tier: 'Medium', note: 'Missing the cutoff man lets trailing runners advance.' },
          impact: { score: 2, tier: 'Medium', note: 'Saves crucial extra bases and cuts down runners at 3rd or home.' }
        },
        diagram: {
          caption: 'Shortstop aligns between left-center gap and home plate as the relay target.',
          runners: ['2nd'],
          ballPath: ['outfield', 'shortstop', 'home'],
          highlightBase: 'shortstop',
          callout: 'Relay line: OF -> SS -> Home'
        },
        experts: {
          coach: 'Outfielder: hit the cutoff man right on the throwing-side shoulder so they can catch and pivot in one motion. Cutoff man: never look at the runner—listen to the catcher or third baseman yelling "Cut 3!" or "Home!"',
          analyst: 'A clean relay reduces throw travel time over 280+ feet compared to a high-arc throw, and cuts throwing-error extra-base probability by more than half.',
          dev: 'Our SVG diagram renders the relay as a two-segment vector (outfield -> shortstop -> home) so learners see why straight-line geometry shaves time.',
          designer: 'Contrast between the powder-blue relay path and the pale clay basepaths ensures clear legibility in both light and dark themes.',
          rookie: 'The coolest part is that the catcher is actually the quarterback on this play—they tell the cutoff player whether to catch-and-hold or throw home.'
        },
        trivia: {
          question: 'When executing a relay throw to home plate, who decides whether the cutoff man should cut the ball or let it bounce through?',
          options: [
            'The catcher (or teammate covering the target base)',
            'The outfielder who already threw the ball',
            'The center-field umpire',
            'The pitcher standing behind the mound'
          ],
          correctIndex: 0,
          explanation: 'The catcher faces both the incoming ball and the advancing runner, making them the only player with the full picture.'
        }
      },
      {
        id: 'xwoba-metrics',
        title: 'Understanding xwOBA Metrics',
        category: 'analytics',
        categoryLabel: 'Analytics',
        difficulty: 5,
        popularity: 79,
        shortSummary: 'Expected Weighted On-Base Average measures how valuable a hitter’s contact SHOULD be, removing defensive luck.',
        quickTakeaway: 'While traditional batting average treats a broken-bat blooper the same as a 110 mph line drive, xwOBA estimates offensive value from exit velocity, launch angle, and strikeouts/walks—ignoring where fielders happened to stand.',
        keyRule: 'MLB league-average xwOBA sits around .315; .370+ marks an elite hitter.',
        meters: {
          difficulty: { score: 3, tier: 'High', note: 'Builds on weighted values plus Statcast expected probabilities.' },
          risk: { score: 1, tier: 'Low', note: 'Diagnostic metric used to spot hot streaks or bad luck.' },
          impact: { score: 3, tier: 'High', note: 'Predicts future offensive production better than batting average.' }
        },
        diagram: {
          caption: 'xwOBA evaluates contact quality at the bat, stripping away stadium & fielder luck.',
          runners: ['home'],
          ballPath: ['home', 'outfield'],
          highlightBase: 'home',
          callout: 'Contact quality > field luck'
        },
        experts: {
          coach: 'Even if you do not track advanced decimals on the field, the lesson for hitters is simple: focus on controlling the strike zone and squaring up the ball hard. Results follow quality contact over a full season.',
          analyst: 'If a hitter has a .260 wOBA in April but a .365 xwOBA, they are hitting rockets right at gloves—expect their real stats to rebound sharply in May.',
          dev: 'Formatting .315 and .370 in IBM Plex Mono with tabular-nums keeps three-decimal baseball stats aligned and effortless to scan.',
          designer: 'Pairing the .315 average / .370 elite benchmarks right inside the quick takeaway gives a beginner immediate scale without needing a statistics textbook.',
          rookie: 'Basically xwOBA tells you if a player is actually crushing the ball even when their batting average looks unlucky!'
        },
        trivia: {
          question: 'A hitter has an actual wOBA of .275, but their xwOBA is .360. What does that usually mean?',
          options: [
            'They have been hitting the ball hard with bad defensive luck and should improve',
            'They are getting lucky with weak bloop hits',
            'They never walk or strike out',
            'They only play defense'
          ],
          correctIndex: 0,
          explanation: 'When xwOBA is much higher than actual wOBA, quality contact has been turned into outs by great defense or unlucky placement.'
        }
      },
      {
        id: 'tagging-up',
        title: 'Tagging Up on Fly Balls',
        category: 'fundamental',
        categoryLabel: 'Fundamental',
        difficulty: 2,
        popularity: 92,
        shortSummary: 'When a fly ball is caught in the air, runners must touch their original base before advancing.',
        quickTakeaway: 'On a fly ball with fewer than 2 outs, go halfway if it is shallow—or return to your base, keep one foot on the bag, and sprint the instant the fielder’s glove touches the ball.',
        keyRule: 'You may leave the base on first touch by the fielder (even if bobbling), not after the catch finishes.',
        meters: {
          difficulty: { score: 1, tier: 'Low', note: 'Simple timing cue once you know how deep the fly ball is.' },
          risk: { score: 2, tier: 'Medium', note: 'Leaving early results in an easy appeal out at your original base.' },
          impact: { score: 3, tier: 'High', note: 'Produces sacrifice flies that score winning runs without a hit.' }
        },
        diagram: {
          caption: 'Runner on 3rd tags the bag and breaks home the instant the outfielder touches the fly ball.',
          runners: ['3rd'],
          ballPath: ['home', 'outfield', 'home'],
          highlightBase: '3rd',
          callout: 'Wait for first glove touch'
        },
        experts: {
          coach: 'Runners on 3rd: get your left foot on the edge of the bag facing the outfielder so you can watch the catch directly and take off with zero wasted steps. With 2 outs, always run on contact!',
          analyst: 'Scoring a runner from 3rd via a sacrifice fly raises inning win probability dramatically late in a tie game—often worth +18% to +25% win expectancy in the 8th or 9th inning.',
          dev: 'Notice how every scenario shares one unified schema (id, meters, diagram, experts, trivia), so adding a 9th or 10th play requires zero UI code changes.',
          designer: 'Showing the runner anchored on 3rd with the fly ball path to the outfield makes the "tag-and-sprint" sequence clear in a single glance.',
          rookie: 'Wait—you can start running as soon as the ball touches the glove, even if they juggle it?! That blew my mind!'
        },
        trivia: {
          question: 'With 1 out and a runner on 3rd, the outfielder bobbles a deep fly ball before finally securing it. When is the runner legally allowed to leave 3rd base?',
          options: [
            'The instant the ball first touches the fielder’s glove',
            'Only after the fielder holds it steady for 2 seconds',
            'As soon as the bat hits the ball',
            'Only after the umpire signals safe'
          ],
          correctIndex: 0,
          explanation: 'By rule, a runner may retouch and leave the base the moment the fly ball is first touched by a fielder, preventing defenders from intentionally juggling the ball.'
        }
      }
    ]
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DIAMONDIQ_DATA;
  }
  if (typeof window !== 'undefined') {
    root.DIAMONDIQ_DATA = DIAMONDIQ_DATA;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
