/* DiamondIQ — Shared Seed Data
   8 rich baseball scenarios (with 5-expert breakdowns, 3-tier stat meters,
   tactical SVG diamond diagram metadata, and trivia checks) + fun facts. */

const OPENING_DAY_ISO = '2027-03-25T17:00:00Z';

const EXPERT_PROFILES = [
  {
    id: 'coach',
    role: 'Baseball Fundamentals',
    title: 'Youth Baseball Coach',
    summaryLabel: "Coach's Call",
    focus: 'Real rules, situational footwork, and simple game-day cues.'
  },
  {
    id: 'analyst',
    role: 'Baseball Stats',
    title: 'Sabermetrics Analyst',
    summaryLabel: 'By the Numbers',
    focus: 'Modern Statcast metrics translated into Low / Medium / High gauges.'
  },
  {
    id: 'dev',
    role: 'How It Works',
    title: 'Web Dev Mentor',
    summaryLabel: 'Behind the Page',
    focus: 'How baseball rules map cleanly to structured data and web UI.'
  },
  {
    id: 'designer',
    role: 'Design & Clarity',
    title: 'UI/UX Designer',
    summaryLabel: 'Design Notes',
    focus: 'Clear diagrams, accessible contrast, and clean responsive grids.'
  },
  {
    id: 'rookie',
    role: 'Beginner Take',
    title: 'Rookie Player',
    summaryLabel: 'Rookie Take',
    focus: 'Plain-English "aha!" takeaways without confusing jargon.'
  }
];

const FUN_FACTS = [
  'A regulation MLB baseball has exactly 108 double stitches of red waxed thread.',
  'The distance between each base on a standard diamond is 90 feet — and 60 feet, 6 inches from the mound to home plate.',
  'An average MLB fastball reaches home plate in about 0.4 seconds, faster than the blink of an eye.',
  'Catchers call and frame over 140 pitches per game, turning borderline balls into strikes.',
  'Statcast tracks every batted ball using high-speed optical cameras to measure exit velocity and launch angle.',
  'In a 162-game season, an MLB team uses roughly 12,000 to 15,000 baseballs.'
];

const SCENARIOS = [
  {
    id: 'force-vs-tag',
    title: 'Force Out vs. Tag Out',
    category: 'fundamental',
    categoryLabel: 'Fundamental',
    difficulty: 1,
    popularity: 98,
    shortSummary: 'Two ways to get a runner out: step on the base with the ball, or tag the runner directly.',
    quickTakeaway:
      'When a runner has to run to the next base because the batter hit the ball, touching the base with the ball gets them out. Once that runner is not forced forward (nobody is behind them), fielders must tag the runner directly.',
    keyRule: 'MLB Rule 5.09(b)(6): A force play ends as soon as the trailing runner is put out.',
    meters: [
      {
        name: 'Execution Difficulty',
        level: 1,
        tier: 'Low (1/3)',
        caption: 'Easy once you check if the base behind is occupied.'
      },
      {
        name: 'Tactical Risk',
        level: 1,
        tier: 'Low (1/3)',
        caption: 'Stepping on the bag is the safest, quickest out.'
      },
      {
        name: 'Game Impact',
        level: 3,
        tier: 'High (3/3)',
        caption: 'Helps teams turn double plays and stop big innings.'
      }
    ],
    diagram: {
      mode: 'infield-force',
      occupiedBases: ['1B'],
      highlightBase: '2B',
      batterRunning: true,
      throwFrom: 'SS',
      throwTo: '2B',
      callout: 'Runner on 1st is FORCED to 2nd — step on 2B with ball!',
      caption: 'Runner on 1st must advance when the batter hits a grounder, creating a force play at 2nd base.'
    },
    experts: {
      coach:
        'Before every pitch, look at the bases behind the runners. With a runner on 1st, a ground ball forces them to run to 2nd — just catch and touch 2nd base! If 1st base is empty, a runner on 2nd is not forced, so you have to tag them.',
      analyst:
        'Taking the sure force out at 2nd base instead of chasing a tricky tag protects your team from throwing errors and cuts the offense\'s chance of scoring in that inning almost in half.',
      dev:
        'A force play works just like a boolean check: is every base behind the runner occupied? If true, the fielder only needs to touch the destination base; if false, a tag is required.',
      designer:
        'On desktop, all 5 experts and the quick rule card sit in a clean 3×2 grid. On phones, they stack into one column with collapsible accordions so scrolling stays short.',
      rookie:
        'My easy rule to remember: if a teammate behind you is pushing you off your base, the fielder only needs to touch the bag. If nobody is pushing you, they have to tag you!'
    },
    trivia: {
      question:
        'Runners are on 1st and 3rd with one out. The batter hits a grounder to the shortstop. Which bases have a force play?',
      options: [
        { key: 'a', text: '1st base and 2nd base only' },
        { key: 'b', text: 'Home plate and 3rd base' },
        { key: 'c', text: 'All four bases' },
        { key: 'd', text: 'Only 1st base' }
      ],
      correctKey: 'a',
      explanation:
        'Correct! Because 2nd base is empty, the runner on 3rd is NOT forced to run home. Only the batter (to 1st) and the runner on 1st (to 2nd) are forced.'
    }
  },
  {
    id: 'infield-fly',
    title: 'Infield Fly Rule Basics',
    category: 'fundamental',
    categoryLabel: 'Fundamental',
    difficulty: 2,
    popularity: 86,
    shortSummary: 'Protects runners so a fielder cannot drop an easy pop-up on purpose for a cheap double play.',
    quickTakeaway:
      'With fewer than two outs and runners on 1st & 2nd (or bases loaded), an easy pop-up in the infield automatically makes the batter out as soon as the umpire yells "Infield Fly!" — even if the ball drops.',
    keyRule: 'MLB Rule 5.09(a)(5): Applies only with 0 or 1 out and runners on 1st & 2nd (or bases loaded).',
    meters: [
      {
        name: 'Execution Difficulty',
        level: 2,
        tier: 'Medium (2/3)',
        caption: 'Runners and fielders both have to listen for the umpire.'
      },
      {
        name: 'Tactical Risk',
        level: 1,
        tier: 'Low (1/3)',
        caption: 'The rule prevents unfair double-play traps.'
      },
      {
        name: 'Game Impact',
        level: 2,
        tier: 'Medium (2/3)',
        caption: 'Protects big scoring chances when rallies are brewing.'
      }
    ],
    diagram: {
      mode: 'infield-fly',
      occupiedBases: ['1B', '2B'],
      highlightBase: 'SS',
      batterRunning: false,
      throwFrom: 'HOME',
      throwTo: 'SS',
      callout: '0 or 1 out + 1B & 2B occupied: Umpire calls "INFIELD FLY — BATTER IS OUT!"',
      caption: 'Because the batter is automatically out, the runners on 1st and 2nd cannot be tricked into a double play.'
    },
    experts: {
      coach:
        'Tell your runners: stay close to your base! If the fielder catches the pop-up, you can tag up. If it drops by accident, the batter is already out, so you are not forced to run unless you want to gamble.',
      analyst:
        'Without this rule, a clever infielder could turn a routine 1-out pop-up into a double play roughly 80% of the time when bases are occupied, drastically swinging win probability.',
      dev:
        'Notice how the rule relies on three preconditions (`outs < 2`, `runners on 1B and 2B`, `fair fly ball catchable with ordinary effort`) — a great real-world example of compound conditional logic.',
      designer:
        'Highlighting 1st and 2nd base together on the field diagram immediately answers the hardest beginner question: "When does this rule actually turn on?"',
      rookie:
        'At first I thought it meant every infield pop-up was an automatic out! Now I know it ONLY kicks in when there are runners on 1st and 2nd (or bases loaded) with less than 2 outs.'
    },
    trivia: {
      question:
        'Bases are loaded with 2 outs, and the batter hits a high pop-up to the second baseman. Does the Infield Fly Rule apply?',
      options: [
        { key: 'a', text: 'Yes, because the bases are loaded' },
        { key: 'b', text: 'No, because there are already 2 outs' },
        { key: 'c', text: 'Yes, if the ball stays in fair territory' },
        { key: 'd', text: 'Only if the catcher calls for it' }
      ],
      correctKey: 'b',
      explanation:
        'Spot on! With 2 outs, runners are already running on contact and a cheap double play isn\'t possible, so the Infield Fly Rule never applies with 2 outs.'
    }
  },
  {
    id: 'stealing-second',
    title: 'Stealing Second Base Timing',
    category: 'fundamental',
    categoryLabel: 'Fundamental',
    difficulty: 2,
    popularity: 92,
    shortSummary: 'How a runner reads the pitcher and beats the catcher\'s throw to 2nd base.',
    quickTakeaway:
      'Stealing 2nd base is a race against the clock: pitcher delivery time + catcher "pop time" (about 3.3 seconds total) vs. the runner\'s sprint speed from their lead-off.',
    keyRule: 'MLB Rule 5.06(b): A runner who reaches the next base safely without a hit or error earns a stolen base.',
    meters: [
      {
        name: 'Execution Difficulty',
        level: 2,
        tier: 'Medium (2/3)',
        caption: 'Requires reading the pitcher\'s front heel and getting a clean jump.'
      },
      {
        name: 'Tactical Risk',
        level: 2,
        tier: 'Medium (2/3)',
        caption: 'Getting caught steals an out and kills momentum.'
      },
      {
        name: 'Game Impact',
        level: 2,
        tier: 'Medium (2/3)',
        caption: 'Moves the runner into scoring position for a single.'
      }
    ],
    diagram: {
      mode: 'steal-2b',
      occupiedBases: ['1B'],
      highlightBase: '2B',
      batterRunning: false,
      throwFrom: 'HOME',
      throwTo: '2B',
      callout: 'Runner sprints 90 ft (~3.3s) while Catcher throws 127 ft (~2.0s pop time)',
      caption: 'A good 10-foot primary lead shortens the sprint to 2nd base to roughly 80 feet.'
    },
    experts: {
      coach:
        'Watch the pitcher\'s back foot or front shoulder — once they commit toward home plate, explode toward 2nd base! Never peek back at the catcher while running; trust your coach and slide to the outside corner of the bag.',
      analyst:
        'Because getting caught costs an out, stealing 2nd only helps a team score more runs when the runner succeeds at least 73% of the time (the break-even point).',
      dev:
        'Comparing runner sprint time (`distance / speed`) against defense battery time (`pitchTime + popTime`) makes this play easy to model cleanly in our Comparison View.',
      designer:
        'Pairing the runner\'s arrow from 1st-to-2nd with the catcher\'s throw line across the diamond shows the two competing paths at a glance.',
      rookie:
        'I always wondered why runners didn\'t steal on every pitch. Learning that you need to be safe about 3 out of 4 times for it to be worth the risk makes total sense!'
    },
    trivia: {
      question:
        'Roughly what success rate does a base stealer need for stealing 2nd base to help their team score more runs?',
      options: [
        { key: 'a', text: 'Around 40%' },
        { key: 'b', text: 'Around 50%' },
        { key: 'c', text: 'Around 73% or higher' },
        { key: 'd', text: '100% — any caught stealing ruins the inning' }
      ],
      correctKey: 'c',
      explanation:
        'Nice! Analysts calculate the break-even rate at around 72–75% because getting caught out wipes a baserunner off the bases.'
    }
  },
  {
    id: 'launch-angle-exit-velo',
    title: 'Reading Launch Angle & Exit Velocity',
    category: 'analytics',
    categoryLabel: 'Analytics',
    difficulty: 2,
    popularity: 94,
    shortSummary: 'How hard and how high the ball leaves the bat decides if it becomes a hit or an out.',
    quickTakeaway:
      'Exit Velocity (mph) measures how hard the ball was hit. Launch Angle (degrees) measures whether it went down as a grounder, flat as a line drive, or high as a fly ball. Together, 98+ mph at 26–30° is the "Barrel" sweet spot.',
    keyRule: 'Statcast Sweet Spot: Line drives (10°–25°) and Barrels (98+ mph at 26°–30°) produce the highest batting averages.',
    meters: [
      {
        name: 'Execution Difficulty',
        level: 3,
        tier: 'High (3/3)',
        caption: 'Squaring up a 95 mph pitch at the ideal angle takes elite bat control.'
      },
      {
        name: 'Tactical Risk',
        level: 2,
        tier: 'Medium (2/3)',
        caption: 'Swinging for huge lift can cause pop-ups or strikeouts if mistimed.'
      },
      {
        name: 'Game Impact',
        level: 3,
        tier: 'High (3/3)',
        caption: 'Hard line drives and barrels drive extra-base hits and home runs.'
      }
    ],
    diagram: {
      mode: 'statcast-arc',
      occupiedBases: [],
      highlightBase: 'HOME',
      batterRunning: true,
      throwFrom: 'HOME',
      throwTo: 'CF',
      callout: 'Barrel Zone: 98+ mph Exit Velo + 26°–30° Launch Angle = .500+ AVG',
      caption: 'Negative angles are grounders; 10°–25° are line drives; 26°–30° at high speed are home-run barrels.'
    },
    experts: {
      coach:
        'You don\'t need to swing upward wildly to get a good launch angle. Focus on hitting the ball out in front of home plate with a level, strong swing through the zone — solid contact creates natural backspin and lift.',
      analyst:
        'Balls hit at 95+ mph are officially "Hard Hit." Combine 98+ mph with a 26°–30° launch angle and MLB hitters bat over .500 and slug over 1.500 on those swings!',
      dev:
        'Instead of dumping raw physics equations onto beginners, we convert complex Statcast degrees and mph numbers into clear Low/Medium/High gauges and visual arc zones.',
      designer:
        'Keeping the stat labels in monospace tabular numbers (`98+ mph`, `26°–30°`) helps young readers scan numbers fast without squinting.',
      rookie:
        'Exit velocity is just "how fast the ball jumped off the bat," and launch angle is just "how steep it took off." Seeing it on a chart made TV broadcasts 10x easier to understand!'
    },
    trivia: {
      question:
        'Which batted ball profile is most likely to be a crisp line drive rather than a grounder or pop-up?',
      options: [
        { key: 'a', text: 'Launch angle of -10 degrees' },
        { key: 'b', text: 'Launch angle between 10 and 25 degrees' },
        { key: 'c', text: 'Launch angle of 65 degrees' },
        { key: 'd', text: 'Exit velocity of 55 mph at 50 degrees' }
      ],
      correctKey: 'b',
      explanation:
        'Right! Launch angles between 10° and 25° produce line drives — the highest-percentage hits in baseball.'
    }
  },
  {
    id: 'catcher-framing',
    title: 'Catcher Framing Fundamentals',
    category: 'fundamental',
    categoryLabel: 'Fundamental',
    difficulty: 2,
    popularity: 80,
    shortSummary: 'Catching a borderline pitch cleanly so the umpire clearly sees it as a strike.',
    quickTakeaway:
      'Catcher framing isn\'t about fooling the umpire with big glove jerks — it\'s about beating the ball to the spot with quiet wrists so borderline strikes stay in the strike zone.',
    keyRule: 'Strike Zone Cue: Receive the ball smoothly from bottom-up or outside-in without stabbing or dropping the glove.',
    meters: [
      {
        name: 'Execution Difficulty',
        level: 2,
        tier: 'Medium (2/3)',
        caption: 'Requires soft hands and strong forearms on 90+ mph pitches.'
      },
      {
        name: 'Tactical Risk',
        level: 1,
        tier: 'Low (1/3)',
        caption: 'Quiet receiving also prevents passed balls and wild pitches.'
      },
      {
        name: 'Game Impact',
        level: 2,
        tier: 'Medium (2/3)',
        caption: 'Elite framers can steal 1–2 extra strikes per game for their pitchers.'
      }
    ],
    diagram: {
      mode: 'framing-zone',
      occupiedBases: [],
      highlightBase: 'HOME',
      batterRunning: false,
      throwFrom: 'P',
      throwTo: 'HOME',
      callout: 'Quiet glove + soft wrists at the edge of the zone keeps borderline strikes called strikes.',
      caption: 'Receiving the low pitch upward by a few inches helps the umpire see the ball cross the knee-high strike zone.'
    },
    experts: {
      coach:
        'Start with your glove relaxed near the ground so your wrist turns upward into the ball. Catch the outer half of the baseball and stick the glove still for half a second — never yank the glove across your body!',
      analyst:
        'Statcast tracks Catcher Framing Runs by measuring how often a catcher turns pitches in the "shadow zone" (within one ball-width of the strike zone border) into called strikes.',
      dev:
        'Notice how every scenario shares the exact same database schema (`meters_json`, `experts_json`, `trivia_json`), whether it covers infield footwork or catcher glove work.',
      designer:
        'Using consistent 3-segment stat bars across all scenarios lets learners compare catching skills and hitting analytics on the same scale.',
      rookie:
        'I used to think framing meant yanking your glove three feet into the middle of the plate. Knowing it\'s actually about holding the glove steady and quiet makes total sense!'
    },
    trivia: {
      question:
        'What is the biggest mistake young catchers make when trying to frame a borderline pitch?',
      options: [
        { key: 'a', text: 'Keeping a relaxed glove before the pitch arrives' },
        { key: 'b', text: 'Jerking or yanking the glove fast toward the middle of the plate' },
        { key: 'c', text: 'Holding the glove steady for a split second after the catch' },
        { key: 'd', text: 'Setting up behind home plate in a balanced stance' }
      ],
      correctKey: 'b',
      explanation:
        'Exactly! Big, sudden glove jerks tip off the umpire that the pitch was actually a ball. Smooth, quiet receiving earns far more strikes.'
    }
  },
  {
    id: 'relay-throw',
    title: 'Executing a Relay Throw',
    category: 'fundamental',
    categoryLabel: 'Fundamental',
    difficulty: 2,
    popularity: 84,
    shortSummary: 'How an infielder lines up between the outfielder and a base to fire a faster, more accurate throw.',
    quickTakeaway:
      'On deep hits to the outfield wall, two short, crisp throws through a "cutoff" infielder are faster and more accurate than one wild, rainbow throw all the way to home plate.',
    keyRule: 'Defense Rule of Thumb: Shortstop takes relays from left/center; Second Baseman takes relays from right field.',
    meters: [
      {
        name: 'Execution Difficulty',
        level: 2,
        tier: 'Medium (2/3)',
        caption: 'All nine defenders have a job on every gap hit.'
      },
      {
        name: 'Tactical Risk',
        level: 2,
        tier: 'Medium (2/3)',
        caption: 'A missed cutoff lets trailing runners take extra bases.'
      },
      {
        name: 'Game Impact',
        level: 3,
        tier: 'High (3/3)',
        caption: 'Cuts down tying and winning runs at the plate.'
      }
    ],
    diagram: {
      mode: 'relay-throw',
      occupiedBases: ['2B'],
      highlightBase: 'HOME',
      batterRunning: true,
      throwFrom: 'LF',
      throwTo: 'HOME',
      callout: 'Outfielder -> Cutoff (SS) -> Catcher at Home Plate! Keep the ball low and on-line.',
      caption: 'The catcher lines up the shortstop directly between the outfielder and home plate, yelling "Cut!" or "Let it go!"'
    },
    experts: {
      coach:
        'As the cutoff player, put both hands up high so the outfielder has a clear target, and turn your glove side toward the ball so you can spin and throw in one quick step. Catcher: you are the quarterback — yell "Four!" (home) or "Cut Two!" clearly.',
      analyst:
        'Because air drag slows down a 300-foot throw, two crisp 150-foot throws actually arrive at home plate faster than one high-arcing throw — and cut throwing-error rates dramatically.',
      dev:
        'Modeling multi-hop throws (`LF -> SS -> HOME`) in SVG diagram data shows how clean JSON structures can drive interactive visuals without hardcoding 8 separate HTML pages.',
      designer:
        'Dashed throw lines vs. solid basepaths create an instant visual distinction between where the ball is moving and where the runners are sprinting.',
      rookie:
        'I always wondered why the shortstop ran halfway into the grass! Learning that two quick throws beat one giant loopy throw explains everything.'
    },
    trivia: {
      question:
        'A double is hit deep into the right-field corner. Which infielder usually runs out as the primary relay (cutoff) person?',
      options: [
        { key: 'a', text: 'Third baseman' },
        { key: 'b', text: 'Second baseman' },
        { key: 'c', text: 'Catcher' },
        { key: 'd', text: 'Left fielder' }
      ],
      correctKey: 'b',
      explanation:
        'Correct! The second baseman handles relays from right field, while the shortstop handles relays from left and center field.'
    }
  },
  {
    id: 'xwoba-metrics',
    title: 'Understanding xwOBA Metrics',
    category: 'analytics',
    categoryLabel: 'Analytics',
    difficulty: 3,
    popularity: 78,
    shortSummary: 'Measuring how good a hitter\'s swing contact was, without worrying about lucky or unlucky defense.',
    quickTakeaway:
      'xwOBA (Expected Weighted On-Base Average) grades a hitter based on walks, strikeouts, exit velocity, and launch angle — ignoring whether a defender made a miraculous diving catch or got a lucky hop.',
    keyRule: 'Statcast Benchmark: .320 is MLB average xwOBA; .370+ is All-Star caliber; .400+ is MVP level.',
    meters: [
      {
        name: 'Execution Difficulty',
        level: 3,
        tier: 'High (3/3)',
        caption: 'Understanding "expected" stats takes one extra step past Batting Average.'
      },
      {
        name: 'Tactical Risk',
        level: 1,
        tier: 'Low (1/3)',
        caption: 'Helps players stay confident during unlucky hitting slumps.'
      },
      {
        name: 'Game Impact',
        level: 3,
        tier: 'High (3/3)',
        caption: 'Predicts future offensive breakouts better than Batting Average.'
      }
    ],
    diagram: {
      mode: 'xwoba-scale',
      occupiedBases: [],
      highlightBase: 'HOME',
      batterRunning: false,
      throwFrom: 'HOME',
      throwTo: 'CF',
      callout: 'Same 104 mph line drive: Caught = .000 AVG, but still ~.650 xwOBA!',
      caption: 'xwOBA rewards quality contact and plate discipline, separating skill from luck.'
    },
    experts: {
      coach:
        'For young hitters, xwOBA proves what coaches always say: "Control what you can control!" If you hit a rocket right at the center fielder, don\'t slam your helmet — you did your job at the plate.',
      analyst:
        'Batting average treats a lucky bloop single the same as a 110 mph double, and ignores walks. xwOBA weights walks, singles, doubles, triples, and homers using contact quality — making it far better at predicting next month\'s stats.',
      dev:
        'Notice that `xwOBA` has a higher difficulty rating (`3/3`) than `Force Out vs. Tag Out` (`1/3`), which automatically drives the Difficulty Sort on our Scenario Library page.',
      designer:
        'Instead of intimidating readers with a massive algebra formula, we anchor xwOBA to three simple numbers: .320 (average), .370 (great), and .400+ (elite).',
      rookie:
        'So xwOBA basically asks: "If you hit the ball that hard at that angle 100 times, how good would your stats look?" That makes slumps way less confusing!'
    },
    trivia: {
      question:
        'A hitter smashes a 106 mph line drive straight into the shortstop\'s glove for an out. What does xwOBA think of that swing?',
      options: [
        { key: 'a', text: 'It treats it as a terrible at-bat (.000)' },
        { key: 'b', text: 'It credits the hitter with high expected value because the contact quality was elite' },
        { key: 'c', text: 'It only counts strikeouts and walks' },
        { key: 'd', text: 'It subtracts points for hitting it to shortstop' }
      ],
      correctKey: 'b',
      explanation:
        'Bingo! xwOBA ignores where the fielder happened to be standing and grades the quality of the contact (106 mph line drive = very high expected value).'
    }
  },
  {
    id: 'tagging-up',
    title: 'Tagging Up on Fly Balls',
    category: 'fundamental',
    categoryLabel: 'Fundamental',
    difficulty: 1,
    popularity: 90,
    shortSummary: 'When a runner can safely sprint to the next base right after an outfielder catches a fly ball.',
    quickTakeaway:
      'When a fly ball is caught, runners must touch ("tag") their current base before sprinting to the next base. You can leave the instant the ball first touches the fielder\'s glove — you don\'t have to wait for them to stop bobbling it!',
    keyRule: 'MLB Rule 5.09(b)(5): A runner may legally leave their base the moment a fly ball is first touched by a fielder.',
    meters: [
      {
        name: 'Execution Difficulty',
        level: 1,
        tier: 'Low (1/3)',
        caption: 'Simple once you watch the catch with one foot on the bag.'
      },
      {
        name: 'Tactical Risk',
        level: 2,
        tier: 'Medium (2/3)',
        caption: 'Leaving a split-second too early results in an easy appeal out.'
      },
      {
        name: 'Game Impact',
        level: 3,
        tier: 'High (3/3)',
        caption: 'Scores runs on sacrifice flies without needing a base hit.'
      }
    ],
    diagram: {
      mode: 'tag-up',
      occupiedBases: ['3B'],
      highlightBase: 'HOME',
      batterRunning: false,
      throwFrom: 'CF',
      throwTo: 'HOME',
      callout: 'Foot on 3B -> Ball touches CF glove -> Sprint Home! (Sacrifice Fly)',
      caption: 'On a deep fly ball with 0 or 1 out, a runner on 3rd tags the bag and sprints home the instant the ball is touched.'
    },
    experts: {
      coach:
        'With 0 or 1 out and a runner on 3rd, get back to 3rd base immediately as the fly ball goes up, put one foot on the front edge of the bag, watch the outfielder\'s glove, and sprint the moment the ball hits leather!',
      analyst:
        'A productive sacrifice fly from 3rd base produces 1 guaranteed run and boosts win probability sharply in late innings — and doesn\'t even hurt the batter\'s batting average!',
      dev:
        'Comparing Tagging Up (`Medium` tactical risk) side-by-side against Force Out (`Low` tactical risk) on `compare.html` highlights why leaving early is the key mistake to watch.',
      designer:
        'Showing the runner anchored on 3rd base with a bright arrow to home plate reinforces the "wait on the bag, then go" sequence visually.',
      rookie:
        'I didn\'t realize you can run the second the fielder FIRST touches the ball, even if they juggle it! And now I finally know what a "Sac Fly" means in the box score.'
    },
    trivia: {
      question:
        'With 1 out and a runner on 3rd, the center fielder juggles a deep fly ball before securing the catch. When is the runner legally allowed to leave 3rd base?',
      options: [
        { key: 'a', text: 'As soon as the ball leaves the bat' },
        { key: 'b', text: 'The moment the ball FIRST touches the outfielder\'s glove' },
        { key: 'c', text: 'Only after the outfielder finishes juggling and holds it cleanly for 2 seconds' },
        { key: 'd', text: 'Only after the umpire signals safe' }
      ],
      correctKey: 'b',
      explanation:
        'Correct! MLB rules allow the runner to leave as soon as the ball is FIRST touched, so bobbling the ball can\'t trap a runner at 3rd.'
    }
  }
];

module.exports = {
  OPENING_DAY_ISO,
  EXPERT_PROFILES,
  FUN_FACTS,
  SCENARIOS
};
