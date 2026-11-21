/* DiamondIQ — Interactive Mechanics Video Clinic + 20-Question Flaw Diagnostic Quiz */
(function () {
  'use strict';

  const QUIZ_STORAGE_KEY = 'diamondiq_quiz_report_v1';

  /* =========================================================
     8 Interactive Biomechanics Tutorial Videos (4 Hitting + 4 Fielding)
     ========================================================= */
  const VIDEO_CLINICS = [
    {
      id: 'bat-drag',
      domain: 'hitting',
      domainLabel: 'Hitting · Connection',
      title: 'Fix Bat Drag & Late Barrel',
      flawName: 'Bat Drag (Rear Elbow Passes Hands)',
      fixCue: 'Back elbow slots beside hip while hands stay stacked above the rear shoulder.',
      summary: 'When the back elbow shoots ahead of the hands, the barrel drags flat behind the zone, causing jammed inside flares and weak opposite-field pop-ups.',
      stages: ['1. Stance & Load', '2. Hip Turn & Slot', '3. Deep Contact', '4. High Finish'],
      stageCues: [
        'Pin a towel under your rear armpit; coil weight inside back thigh while hands stay stacked above back shoulder.',
        'Fire your belt buckle toward the pitcher FIRST while keeping rear elbow tucked beside hip — do NOT let elbow pass your hands.',
        'Barrel whips behind the ball cleanly through the inner third; rear palm faces up at deep contact.',
        'Finish tall above your front shoulder with full two-hand or smooth one-hand follow-through.'
      ],
      howToSteps: [
        'Toggle 0.45x Slow-Mo and click Stage 2 (Hip Turn & Slot) to compare elbow position side-by-side.',
        'Watch the highlighted rear-elbow ring: keep it stacked beside your hip instead of shooting toward the pitcher.',
        'Practice 3×10 Towel-Under-Armpit tee reps, then swing Baum Bat Gold (-3) in the 3D Stadium.'
      ],
      batId: 'baum-gold',
      batNote: 'Swing the Baum Bat Gold (-3) in the cage — heavy end feedback punishes dragged barrels immediately.',
      scenarioId: 'launch-angle-exit-velo',
      drills: [
        {
          name: 'Towel Under Back Armpit Drill',
          setup: 'Tuck a folded batting towel under your rear armpit before striding on a tee.',
          reps: '3 sets × 10 swings',
          cue: 'Keep the towel pinned until contact! If it drops before the ball leaves the tee, your back elbow disconnected.'
        },
        {
          name: 'Connection Ball Forearm Squeeze',
          setup: 'Place a light inflatable ball between your biceps and ribs during soft toss.',
          reps: '3 sets × 8 swings',
          cue: 'Turn your belt buckle and hands together so the knob points inside the ball.'
        }
      ]
    },
    {
      id: 'casting',
      domain: 'hitting',
      domainLabel: 'Hitting · Swing Path',
      title: 'Stop Casting & Loopy Swings',
      flawName: 'Casting (Hands Sweep Away From Torso)',
      fixCue: 'Keep hands tight to the back shoulder and drive the knob straight inside the baseball.',
      summary: 'Pushing your hands outward around the ball creates a long, slow arc. Pitchers beat inside fastballs easily and you hit weak fly balls or roll off the end cap.',
      stages: ['1. Quiet Hands', '2. Tight Knob Path', '3. Inside-Out Square', '4. Clean Extension'],
      stageCues: [
        'Set hands softly near your back shoulder without drifting backward or pushing toward home plate.',
        'Drive the bat knob straight toward the pitcher past your chest while hugging the imaginary wall behind you.',
        'Stay inside the seam with compact arms so the barrel whips flush onto inside fastballs.',
        'Extend cleanly toward center-left gap without wrapping around the ball early.'
      ],
      howToSteps: [
        'Check the dashed reference wall line behind the hitter in Stage 2 (Tight Knob Path).',
        'Notice how the Pro figure clears the wall cleanly while Flaw casts the barrel wide.',
        'Complete 3×12 dry Fence-Wall swings before stepping into the Omaha cage against Fastballs.'
      ],
      batId: 'combat-blue',
      batNote: 'Try the Combat Spec-A1 Members Club Blue (-3) for fast balanced hand speed inside the ball.',
      scenarioId: 'xwoba-metrics',
      drills: [
        {
          name: 'Paint-the-Fence Wall Drill',
          setup: 'Stand 18 inches away facing away from a dugout wall or net with a bat.',
          reps: '3 sets × 12 dry swings',
          cue: 'Take your full swing without scraping the barrel on the wall behind you—your hands stay compact inside.'
        },
        {
          name: 'High-Tight Tee Inside Path',
          setup: 'Set the tee slightly higher and deeper on the inner third of home plate.',
          reps: '3 sets × 10 swings',
          cue: 'Drive the ball toward the center-field shortstop gap without letting hands drift toward the 3rd-base line.'
        }
      ]
    },
    {
      id: 'rolling-over',
      domain: 'hitting',
      domainLabel: 'Hitting · Extension',
      title: 'Fix Rolling Over Grounders',
      flawName: 'Rolling Over (Early Top-Hand Wrist Snap)',
      fixCue: 'Enter the pitch plane early (+6° to +13° attack angle) and hold Palm-Up / Palm-Down 8+ inches past contact.',
      summary: 'Snapping the top wrist over before or right at contact slams the barrel downward, turning hard pitches into weak pull-side grounders.',
      stages: ['1. Balanced Load', '2. On-Plane Entry', '3. Palm-Up Contact', '4. Full Zone Extension'],
      stageCues: [
        'Coil gently into the inside of your back thigh with relaxed forearms and stacked knuckles.',
        'Drop the barrel behind your shoulder into the pitch plane (+6° to +13° slight upward path) instead of chopping steep.',
        'Meet the ball deep with your top/rear palm facing up and bottom/lead palm facing down — resist rolling your top wrist over.',
        'Drive your barrel 8+ inches out toward the center-left gap before finishing above your front shoulder.'
      ],
      howToSteps: [
        'Freeze Stage 3 (Palm-Up Contact) and look at the batted ball flight line: Pro lifts at 26° while Flaw chops down.',
        'Mirror the Palm-Up/Palm-Down freeze drill stopping 8 inches past a waist-high tee.',
        'Test 2026 DeMarini The Goods (-3) in the 3D Stadium aiming your PCI 0.25" under ball center.'
      ],
      batId: 'goods-2026',
      batNote: 'Test with 2026 The Goods (-3): hold top-hand palm skyward and launch balls 25°–30° into LF/LCF.',
      scenarioId: 'launch-angle-exit-velo',
      drills: [
        {
          name: 'Palm-Up / Palm-Down Freeze Drill',
          setup: 'Hit off a waist-high tee and stop the bat 8 inches past the tee stem.',
          reps: '4 sets × 8 swings',
          cue: 'Freeze and check your hands: top/rear palm faces the sky, bottom/lead palm faces home plate—no early wrist roll!'
        },
        {
          name: 'Bottom-Hand Isolation Tee',
          setup: 'Choke up 2 inches using only your lead arm (bottom hand) on the handle.',
          reps: '3 sets × 10 reps',
          cue: 'Pull the knob cleanly toward the pitcher and hit crisp line drives up the middle.'
        }
      ]
    },
    {
      id: 'lunging',
      domain: 'hitting',
      domainLabel: 'Hitting · Timing & Balance',
      title: 'Eliminate Lunging & Weight Drift',
      flawName: 'Lunging (Front Knee Collapses & Head Dives Forward)',
      fixCue: 'Coil into the back hip, land softly, and brace against a firm front leg at swing launch.',
      summary: 'Jumping forward at pitch release locks out your front knee early, making curveballs and changeups impossible to hit.',
      stages: ['1. Back-Hip Coil', '2. Soft Stride Land', '3. Firm Front Block', '4. Head Centered'],
      stageCues: [
        'Coil slightly inward into your back hip pocket while keeping your head quiet between both feet.',
        'Stride softly onto the ball of your front foot with weight still held 60/40 behind your front hip.',
        'Lock your front knee into a firm block right as your hips fire — zero extra forward slide.',
        'Eyes stay level right at contact so curveballs and changeups stay in focus longer.'
      ],
      howToSteps: [
        'Compare head height and front-knee angle in Stage 2 and Stage 3 using Side-by-Side view.',
        'Rehearse the 2-Second Stride Pause drill so your front leg learns to absorb and block energy.',
        'Face Mix / Curveballs in the 3D Stadium with Combat Spec-A1 Rodeo (-3).'
      ],
      batId: 'combat-rodeo',
      batNote: 'Pair with Combat Spec-A1 Rodeo (-3) against Mix/Changeup pitches in the 3D cage.',
      scenarioId: 'xwoba-metrics',
      drills: [
        {
          name: 'Step-Back (Happy Gilmore) Rhythm Drill',
          setup: 'Start with front foot crossed slightly behind, step back into stride, then fire.',
          reps: '3 sets × 10 swings',
          cue: 'Feel weight stack over your back shoe before rotating—zero forward head dive.'
        },
        {
          name: '2-Second Stride Pause Front Toss',
          setup: 'Lift, land into your hitting position, pause 1 second on coach command, then swing.',
          reps: '3 sets × 8 swings',
          cue: 'Prove you can generate 100% power purely from hip-shoulder separation without lunging.'
        }
      ]
    },
    {
      id: 'glove-stab',
      domain: 'fielding',
      domainLabel: 'Fielding · Infield Hands',
      title: 'Out-Front Glove Presentation & Funnel',
      flawName: 'Stabbing Deep (Stiff Wrists Between Feet)',
      fixCue: 'Form a wide triangle out in front of your eyes, thumb down, and softly funnel into your chest.',
      summary: 'Waiting until the grounder reaches your ankles causes late stiff stabs and bad-hop errors. Working through the ball out front lets you adjust smoothly.',
      stages: ['1. Low Ready Base', '2. Triangle Out Front', '3. Soft Catch', '4. Funnel to Chest'],
      stageCues: [
        'Sink hips low before the ball arrives with chest angled down and eyes tracking the hop early.',
        'Extend both hands cleanly out in front of your face forming a relaxed wide triangle.',
        'Present thumb down / pinky in and work slightly THROUGH the bounce rather than jabbing down.',
        'Glide the glove softly toward your belly button as throwing fingers find a 4-seam grip.'
      ],
      howToSteps: [
        'Scrub Stage 2 (Triangle Out Front) to see how far ahead of your cleats your glove needs to be.',
        'Notice Flaw stabbing straight down deep between the ankles where hops are blind.',
        'Run 4×20 Wall Short-Hop Rapid Hands before infield grounder practice.'
      ],
      batId: 'baum-gold',
      batNote: 'Clean infield hands mirror clean barrel control—stay athletic with quiet eyes.',
      scenarioId: 'force-vs-tag',
      drills: [
        {
          name: 'Wall Short-Hop Rapid Hands',
          setup: 'Kneel or crouch 6 feet from a flat wall and bounce crisp short hops to yourself.',
          reps: '4 sets × 20 catches',
          cue: 'Push the glove slightly forward through the bounce with relaxed fingers pointing down.'
        },
        {
          name: 'Barehand Roller Funneling',
          setup: 'Field 15 slow tennis or baseball rollers with zero glove, using two soft hands.',
          reps: '3 sets × 15 reps',
          cue: 'Meet the ball outside your left eye and glide it smoothly into your belly button.'
        }
      ]
    },
    {
      id: 'footwork-cadence',
      domain: 'fielding',
      domainLabel: 'Fielding · Infield Footwork',
      title: 'Right-Left Infield Footwork & Transfers',
      flawName: 'Flat-Footed Wait (Stuck on Heels)',
      fixCue: 'Time your approach "Right, Left, Field, Right, Throw" so momentum flows toward 1st base.',
      summary: 'Catching grounders on your heels forces all-arm throws with low accuracy. Rhythmic footwork puts your body behind every throw automatically.',
      stages: ['1. Prep Creep Step', '2. Round Angle', '3. Right-Left Catch', '4. Step & Fire'],
      stageCues: [
        'Take an athletic creep step landing softly on the balls of your feet as the pitch crosses the plate.',
        'Work slightly right around the grounder to create an inline angle directly toward 1st base.',
        'Step Right—Left into the ball so your hips and glove glide forward through the catch.',
        'Replace your right foot straight toward target and release cleanly with body momentum behind it.'
      ],
      howToSteps: [
        'Follow the green dashed footwork arrow underneath the Pro fielder across Stages 2–4.',
        'Say "Right—Left—Catch—Right—Throw" aloud at 0.45x speed until your feet sync naturally.',
        'Practice 3×12 Line Cadence reps with cones before live fungo grounders.'
      ],
      batId: 'goods-2022',
      batNote: 'Strong throwing rhythm pairs with strong lower-half ground force.',
      scenarioId: 'force-vs-tag',
      drills: [
        {
          name: 'Line Cadence "Right-Left-Field"',
          setup: 'Place two cones 4 feet left/right of the ball to force rounding slightly toward 3rd-base side.',
          reps: '3 sets × 12 reps',
          cue: 'Say "Right—Left—Catch—Right—Throw" aloud as your feet replace cleanly toward 1st base.'
        },
        {
          name: 'Quick-Exchange Seam Transfer',
          setup: 'Start in fielding triangle with partner 45 ft away; sprint transfer from funnel to 4-seam grip.',
          reps: '3 sets × 12 throws',
          cue: 'Keep elbows compact and step straight down the target line with zero extra hops.'
        }
      ]
    },
    {
      id: 'banana-route',
      domain: 'fielding',
      domainLabel: 'Fielding · Outfield Routes',
      title: '45° Drop-Step & Route Efficiency',
      flawName: 'Banana Route (Curving Arc & Backpedaling)',
      fixCue: 'Snap your hips open 45°, pump both arms with glove tucked, and run straight to the landing spot.',
      summary: 'Backpedaling or curving toward the gap loses 10–15 feet of range. A clean drop-step gets you to the ball fast so you settle under it under control.',
      stages: ['1. Athletic Read', '2. 45° Hip Drop-Step', '3. Pump Arms Sprint', '4. Settle & Catch'],
      stageCues: [
        'Hold an athletic ready stance tracking trajectory right off the barrel instead of backpedaling.',
        'Whip the back hip and shoulder open 45° instantaneously toward the gap.',
        'Tuck your glove side arm and sprint straight toward the projected X — fastest in the first 3 steps.',
        'Arrive under control, raise the glove smoothly at the last moment, and catch on the move.'
      ],
      howToSteps: [
        'Compare the straight green vector vs. the wide curving red banana arc on the overhead turf chart.',
        'Do 4×8 Coach-Point Drop-Step Breaks focusing purely on hip snap speed on step #1.',
        'Keep your glove down pumping until the final 2–3 steps beneath the ball.'
      ],
      batId: 'combat-blue',
      batNote: 'Outfield speed + barrel control keeps line drives from finding the gap.',
      scenarioId: 'relay-throw',
      drills: [
        {
          name: 'Coach-Point Drop-Step Break',
          setup: 'Stand facing coach at 35 ft; coach points left-back or right-back and immediately tosses a deep fly.',
          reps: '4 sets × 8 sprints',
          cue: 'Whip the shoulder and hip open instantly while keeping eyes locked—only raise your glove at the very end!'
        },
        {
          name: 'Straight-Line Chalk Lane Track',
          setup: 'Track deep angled fly balls along a diagonal line without drifting off course.',
          reps: '3 sets × 6 balls',
          cue: 'Be faster in the first 3 steps than the last 3 steps so you catch on the move.'
        }
      ]
    },
    {
      id: 'crow-hop',
      domain: 'fielding',
      domainLabel: 'Fielding · Outfield Throwing',
      title: 'Low Linear Crow Hop & Relay Throws',
      flawName: 'High-Jump Crow Hop (Vertical Bounce Kills Carry)',
      fixCue: 'Catch moving forward, skim low to the grass with a linear skip-through, and throw through the cutoff.',
      summary: 'Leaping upward wastes time and stalls forward energy. Staying low and driving linearly turns fly-ball momentum into flat, biting one-hop lasers.',
      stages: ['1. Behind-Ball Setup', '2. Catch Through', '3. Low Linear Skip', '4. Downhill Follow'],
      stageCues: [
        'Circle slightly behind the fly ball so every step carries your momentum straight toward the target.',
        'Make the catch slightly ahead of your glove-side shoulder while still moving forward.',
        'Skim low across the grass with your back foot (head level!) instead of jumping upward like a rebound.',
        'Transfer fast near ear height and drive chest downhill throwing through the cutoff chest.'
      ],
      howToSteps: [
        'Toggle Stage 3 (Low Linear Skip) and watch head height: Pro stays flat while Flaw jumps sky-high.',
        'Compare the flat laser throw trajectory in Stage 4 vs. the looping rainbow miss.',
        'Complete 3×10 1-Knee Separation & Low Skip throws hitting a cutoff chest bucket.'
      ],
      batId: 'goods-2026',
      batNote: 'Transferring ground momentum through the core builds both throwing velo and exit velo.',
      scenarioId: 'relay-throw',
      drills: [
        {
          name: '1-Knee Separation & Low Skip Drill',
          setup: 'Start kneeling glove-foot forward, separate hands with glove tucked, then transition to standing low skip-throughs.',
          reps: '3 sets × 10 throws',
          cue: 'Keep your head level like running under a low doorway—forward speed beats height.'
        },
        {
          name: 'Box Cutoff One-Hop Target',
          setup: 'Charge a rolling/bounced ball into an alley, break down cleanly, execute a low crow hop, and hit a cutoff bucket.',
          reps: '3 sets × 8 throws',
          cue: 'Catch outside glove-side foot, skim right foot behind/through, and finish tall over front leg.'
        }
      ]
    }
  ];

  /* =========================================================
     20-Question Hitting & Fielding Flaw Diagnostic Assessment
     ========================================================= */
  const QUIZ_QUESTIONS = [
    // PART 1: SWING & HITTING (Q1–Q10)
    {
      id: 1,
      part: 'hitting',
      partLabel: 'Hitting Mechanics',
      prompt: 'When you make outs on swings in a game, what kind of ball flight happens most often?',
      options: [
        { key: 'a', text: 'Weak rolled-over grounders pulled sharply to 3B/SS (or 1B/2B for lefties)', weights: { 'rolling-over': 4 } },
        { key: 'b', text: 'Late, weak jammed flares or soft pop-ups to the opposite field', weights: { 'bat-drag': 4 } },
        { key: 'c', text: 'Long sweeping foul balls or high lazy fly outs off the end of the bat', weights: { casting: 4 } },
        { key: 'd', text: 'Chopped dribblers right in front of home plate against off-speed', weights: { lunging: 4 } }
      ]
    },
    {
      id: 2,
      part: 'hitting',
      partLabel: 'Hitting Mechanics',
      prompt: 'Right as your front stride foot hits the ground, what do your hands do first?',
      options: [
        { key: 'a', text: 'They stay tucked near my back shoulder while my hips turn underneath', weights: { healthyHit: 3 } },
        { key: 'b', text: 'They drop toward my belt while my rear elbow shoots forward ahead of them', weights: { 'bat-drag': 4 } },
        { key: 'c', text: 'They push straight outward away from my chest toward the pitcher', weights: { casting: 4 } },
        { key: 'd', text: 'My hands and chest drift forward toward the pitcher before I swing', weights: { lunging: 4 } }
      ]
    },
    {
      id: 3,
      part: 'hitting',
      partLabel: 'Hitting Mechanics',
      prompt: 'If you freeze a side-view video halfway into your swing, where is your rear elbow?',
      options: [
        { key: 'a', text: 'Past my belly button out in front of my hands, dragging the barrel', weights: { 'bat-drag': 4 } },
        { key: 'b', text: 'Flared way out away from my ribs with straight stiff arms', weights: { casting: 4 } },
        { key: 'c', text: 'Tucked snugly beside my back hip with the barrel angled up behind', weights: { healthyHit: 3 } },
        { key: 'd', text: 'Already rolling down over the top wrist before contact', weights: { 'rolling-over': 4 } }
      ]
    },
    {
      id: 4,
      part: 'hitting',
      partLabel: 'Hitting Mechanics',
      prompt: 'What usually happens when a pitcher throws a firm fastball on the inside corner?',
      options: [
        { key: 'a', text: 'I get jammed right on the bat label every time and sting my hands', weights: { casting: 3, 'bat-drag': 2 } },
        { key: 'b', text: 'I hook hard grounders 20 feet foul down the pull line', weights: { 'rolling-over': 4 } },
        { key: 'c', text: 'My front side dives early and I spin completely off the ball', weights: { lunging: 3 } },
        { key: 'd', text: 'I turn tight inside it and smash a line drive into the pull gap', weights: { healthyHit: 3 } }
      ]
    },
    {
      id: 5,
      part: 'hitting',
      partLabel: 'Hitting Mechanics',
      prompt: 'How do your mechanics hold up when fooled slightly by a changeup or curveball?',
      options: [
        { key: 'a', text: 'My front leg locks straight and my upper body dives toward the ball', weights: { lunging: 4 } },
        { key: 'b', text: 'My top hand whips over violently and pounds the pitch into the dirt', weights: { 'rolling-over': 4 } },
        { key: 'c', text: 'My arms cast wide early and I roll the outside end of the bat around it', weights: { casting: 3 } },
        { key: 'd', text: 'I keep weight over my back leg and still spoil or barrel it cleanly', weights: { healthyHit: 3 } }
      ]
    },
    {
      id: 6,
      part: 'hitting',
      partLabel: 'Hitting Mechanics',
      prompt: 'Look at your top hand and bottom hand 6 inches AFTER contact with the ball:',
      options: [
        { key: 'a', text: 'My top-hand wrist already rolled completely over facing the pitcher', weights: { 'rolling-over': 4 } },
        { key: 'b', text: 'Top/rear palm faces up and bottom/lead palm faces down extending through', weights: { healthyHit: 3 } },
        { key: 'c', text: 'My bat barrel drops flat behind my shoulder late with low exit speed', weights: { 'bat-drag': 3 } },
        { key: 'd', text: 'My weight is falling toward the opposite batter’s box off balance', weights: { lunging: 3 } }
      ]
    },
    {
      id: 7,
      part: 'hitting',
      partLabel: 'Hitting Mechanics',
      prompt: 'What do your head and eyes do from pitcher release until your bat crosses the plate?',
      options: [
        { key: 'a', text: 'My head lunges forward 6+ inches and drops straight down violently', weights: { lunging: 4 } },
        { key: 'b', text: 'My back shoulder collapses down so my head tilts backwards', weights: { 'bat-drag': 3 } },
        { key: 'c', text: 'Head stays quiet and centered between my knees with steady eyes', weights: { healthyHit: 3 } },
        { key: 'd', text: 'Head pulls away early toward the third/first-base dugout', weights: { 'rolling-over': 2, casting: 2 } }
      ]
    },
    {
      id: 8,
      part: 'hitting',
      partLabel: 'Hitting Mechanics',
      prompt: 'If you stand 18 inches in front of a dugout fence/net and take full dry swings:',
      options: [
        { key: 'a', text: 'My barrel slams backward into the fence early because hands push out', weights: { casting: 4 } },
        { key: 'b', text: 'My bat clears the fence cleanly because my knob pulls inside tight', weights: { healthyHit: 3 } },
        { key: 'c', text: 'My back elbow jams awkwardly and the barrel drops near my belt', weights: { 'bat-drag': 4 } },
        { key: 'd', text: 'I step forward past my balance point and lose posture', weights: { lunging: 3 } }
      ]
    },
    {
      id: 9,
      part: 'hitting',
      partLabel: 'Hitting Mechanics',
      prompt: 'Where on the barrel do most of your mishit balls strike?',
      options: [
        { key: 'a', text: 'Down near the handle/taper—feel jammed with high vibration', weights: { 'bat-drag': 3, casting: 2 } },
        { key: 'b', text: 'Off the very end cap on weak topspin choppers', weights: { 'rolling-over': 3, lunging: 2 } },
        { key: 'c', text: 'Underside of the barrel—constant high foul pop-ups backward', weights: { 'bat-drag': 2, casting: 2 } },
        { key: 'd', text: 'Mostly fat on the sweet spot 4–7 inches from the end cap', weights: { healthyHit: 3 } }
      ]
    },
    {
      id: 10,
      part: 'hitting',
      partLabel: 'Hitting Mechanics',
      prompt: 'Which feeling best describes your swing rhythm in the batter’s box?',
      options: [
        { key: 'a', text: 'I jump out early at pitches and then run out of time to adjust', weights: { lunging: 4 } },
        { key: 'b', text: 'My swing feels long and wide like a big sweeping circle', weights: { casting: 4 } },
        { key: 'c', text: 'I feel like I muscle the bat with my arms while hips stay stuck', weights: { 'bat-drag': 3, 'rolling-over': 2 } },
        { key: 'd', text: 'Smooth coil, short to the ball, long through the middle of the field', weights: { healthyHit: 3 } }
      ]
    },

    // PART 2: FIELDING, FOOTWORK & THROWING (Q11–Q20)
    {
      id: 11,
      part: 'fielding',
      partLabel: 'Fielding & Defense',
      prompt: 'As a batter swings, what are your feet doing in your defensive ready stance?',
      options: [
        { key: 'a', text: 'Standing tall and flat-footed on my heels until the ball passes the pitcher', weights: { 'footwork-cadence': 4 } },
        { key: 'b', text: 'Light athletic prep step landing on balls of feet as ball hits bat', weights: { healthyField: 3 } },
        { key: 'c', text: 'Frozen wide in a squat staring down at the dirt rather than the plate', weights: { 'glove-stab': 3 } },
        { key: 'd', text: 'Drifting backwards on my heels ready to backpedal', weights: { 'banana-route': 3 } }
      ]
    },
    {
      id: 12,
      part: 'fielding',
      partLabel: 'Fielding & Defense',
      prompt: 'At the exact moment a ground ball enters your glove, where is your glove positioned?',
      options: [
        { key: 'a', text: 'Well out in front of my eyes, thumb down, forming an open triangle', weights: { healthyField: 3 } },
        { key: 'b', text: 'Deep between my ankles or tucked right underneath my chest', weights: { 'glove-stab': 4 } },
        { key: 'c', text: 'Jabbing downward fast at the last millisecond with stiff fingers', weights: { 'glove-stab': 4 } },
        { key: 'd', text: 'Reaching off sideways while my feet are completely planted', weights: { 'footwork-cadence': 3 } }
      ]
    },
    {
      id: 13,
      part: 'fielding',
      partLabel: 'Fielding & Defense',
      prompt: 'What happens the split-second AFTER a grounder hits your glove pocket?',
      options: [
        { key: 'a', text: 'My glove softly glides/funnels smoothly toward my midsection to grip seams', weights: { healthyField: 3 } },
        { key: 'b', text: 'My glove stops cold and balls rattle out off the heel of my palm', weights: { 'glove-stab': 4 } },
        { key: 'c', text: 'I pat my glove 2–3 extra times searching for the laces before throwing', weights: { 'footwork-cadence': 3 } },
        { key: 'd', text: 'I stay crouched flat-footed before slowly standing up to throw', weights: { 'crow-hop': 2, 'footwork-cadence': 2 } }
      ]
    },
    {
      id: 14,
      part: 'fielding',
      partLabel: 'Fielding & Defense',
      prompt: 'Look at your feet when throwing a routine infield grounder across to 1st base:',
      options: [
        { key: 'a', text: 'Smooth "Right-Left-Catch-Right-Throw" cadence straight toward 1B', weights: { healthyField: 3 } },
        { key: 'b', text: 'Feet stay glued in place and I heave the throw with pure arm strength', weights: { 'footwork-cadence': 4 } },
        { key: 'c', text: 'I field on the wrong foot and take awkward extra shuffle steps', weights: { 'footwork-cadence': 4 } },
        { key: 'd', text: 'I jump high up in the air right after catching before releasing', weights: { 'crow-hop': 3 } }
      ]
    },
    {
      id: 15,
      part: 'fielding',
      partLabel: 'Fielding & Defense',
      prompt: 'How do you handle a tough short-hop bounce right in front of your feet?',
      options: [
        { key: 'a', text: 'I flinch or raise my head early and the ball kicks off my wrist/chest', weights: { 'glove-stab': 4 } },
        { key: 'b', text: 'I freeze my glove stiffly upright so top-spin hops bounce out', weights: { 'glove-stab': 3, 'footwork-cadence': 2 } },
        { key: 'c', text: 'Keep nose down, push glove gently through the bounce to pick it clean', weights: { healthyField: 3 } },
        { key: 'd', text: 'Back up off my heels trying to make an in-between hop easier', weights: { 'footwork-cadence': 3 } }
      ]
    },
    {
      id: 16,
      part: 'fielding',
      partLabel: 'Fielding & Defense',
      prompt: 'When a deep fly ball is hit over your shoulder in the outfield, what is your first step?',
      options: [
        { key: 'a', text: 'Curved arc ("banana route") looping around before cutting back in', weights: { 'banana-route': 4 } },
        { key: 'b', text: 'Freeze upright or backpedal 3–4 steps before turning to run', weights: { 'banana-route': 4 } },
        { key: 'c', text: 'Sharp 45° drop-step turning hips, pumping arms hard on a direct line', weights: { healthyField: 3 } },
        { key: 'd', text: 'Sprint with my glove extended out in front of me the whole way', weights: { 'banana-route': 3 } }
      ]
    },
    {
      id: 17,
      part: 'fielding',
      partLabel: 'Fielding & Defense',
      prompt: 'When catching a routine fly ball with runners ready to tag up, how are you moving?',
      options: [
        { key: 'a', text: 'Standing still underneath it flat-footed, then starting my throw from zero', weights: { 'crow-hop': 3, 'footwork-cadence': 2 } },
        { key: 'b', text: 'Sprinting sideways or reaching backwards over my head at the last second', weights: { 'banana-route': 4 } },
        { key: 'c', text: 'Behind the ball catching in stride moving forward toward the cutoff', weights: { healthyField: 3 } },
        { key: 'd', text: 'Braking hard with heels dug in right on catch', weights: { 'crow-hop': 3 } }
      ]
    },
    {
      id: 18,
      part: 'fielding',
      partLabel: 'Fielding & Defense',
      prompt: 'What does your outfield crow hop look like when firing to home or 3rd base?',
      options: [
        { key: 'a', text: 'I jump high upward vertically off two feet like a basketball rebound', weights: { 'crow-hop': 4 } },
        { key: 'b', text: 'I skip low across the grass linearly, keeping head level toward target', weights: { healthyField: 3 } },
        { key: 'c', text: 'I rarely crow hop at all—just plant flat and whip with my arm', weights: { 'crow-hop': 4 } },
        { key: 'd', text: 'My front shoulder flies wide open toward the line instead of closed', weights: { 'footwork-cadence': 3 } }
      ]
    },
    {
      id: 19,
      part: 'fielding',
      partLabel: 'Fielding & Defense',
      prompt: 'When you throw hard from the outfield or deep shortstop, where do misses usually go?',
      options: [
        { key: 'a', text: 'High sailing "rainbow" throws over the cutoff man’s head', weights: { 'crow-hop': 4 } },
        { key: 'b', text: 'Weak throws bouncing 15 feet short in the dirt with low carry', weights: { 'crow-hop': 2, 'footwork-cadence': 3 } },
        { key: 'c', text: 'Yanked far toward my glove side because front side pulled open', weights: { 'footwork-cadence': 3, 'crow-hop': 2 } },
        { key: 'd', text: 'Low biting trajectory right on the cutoff chest or sharp one-hop', weights: { healthyField: 3 } }
      ]
    },
    {
      id: 20,
      part: 'fielding',
      partLabel: 'Goal Focus',
      prompt: 'Pick the #1 game-day improvement you want this month above everything else:',
      options: [
        { key: 'a', text: 'Crush harder elevated line drives / bombs instead of weak grounders', weights: { 'rolling-over': 2, 'bat-drag': 1 } },
        { key: 'b', text: 'Catch up to inside heat and stay balanced on sharp curveballs', weights: { casting: 2, lunging: 2 } },
        { key: 'c', text: 'Clean infield hands, faster exchanges, and zero routine errors', weights: { 'glove-stab': 2, 'footwork-cadence': 2 } },
        { key: 'd', text: 'Faster outfield jumps and stronger, laser-accurate relay throws', weights: { 'banana-route': 2, 'crow-hop': 2 } }
      ]
    }
  ];

  const CLINIC_BY_ID = Object.fromEntries(VIDEO_CLINICS.map((c) => [c.id, c]));

  const BAT_RECOMMENDATIONS = {
    'baum-gold': { name: 'Baum Bat Gold (-3)', reason: 'Tight wood-style sweet spot gives honest feedback to eliminate bat drag and sloppy barrel paths.' },
    'goods-2026': { name: '2026 DeMarini The Goods (-3)', reason: 'Heavy end-loaded alloy barrel rewards clean hip rotation and Palm-Up/Palm-Down extension with deep lift.' },
    'goods-2022': { name: '2022 DeMarini The Goods (-3)', reason: 'Classic chrome hybrid whip builds momentum through the zone once your stride stays balanced.' },
    'combat-rodeo': { name: 'Combat Spec-A1 Rodeo (-3)', reason: 'Forgiving 1-piece alloy sweet spot helps off-speed timing adjustments stay sharp in the 3D cage.' },
    'combat-blue': { name: 'Combat Spec-A1 Members Club Blue (-3)', reason: 'Crisp light-swinging balanced feel speeds hands inside fastballs to cure casting.' }
  };

  /* =========================================================
     Interactive Biomechanical Video Renderer (Canvas 16:9 HiDPI)
     ========================================================= */
  function createVideoRenderer(canvas) {
    const ctx = canvas.getContext('2d');
    const W = 760;
    const H = 428;

    function getThemeColors() {
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      return dark
        ? {
            bgTop: '#0b1526',
            bgBot: '#13243d',
            turf: '#124628',
            dirt: '#57361f',
            line: 'rgba(248, 250, 252, 0.45)',
            text: '#f1f5f9',
            muted: '#94a3b8',
            pro: '#22c55e',
            flaw: '#f87171',
            guide: '#38bdf8',
            body: '#cbd5e1',
            jerseyPro: '#0284c7',
            jerseyFlaw: '#b91c1c'
          }
        : {
            bgTop: '#0e1d34',
            bgBot: '#172e4f',
            turf: '#166534',
            dirt: '#6b4226',
            line: 'rgba(255, 255, 255, 0.5)',
            text: '#f8fafc',
            muted: '#cbd5e1',
            pro: '#4ade80',
            flaw: '#fb7185',
            guide: '#38bdf8',
            body: '#e2e8f0',
            jerseyPro: '#0ea5e9',
            jerseyFlaw: '#e11d48'
          };
    }

    function smoothStep(u) {
      const t = Math.max(0, Math.min(1, u));
      return t * t * (3 - 2 * t);
    }

    function drawSegment(x1, y1, x2, y2, w, color) {
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    function drawTaperedLimb(x1, y1, x2, y2, r1, r2, fill, highlightColor = 'rgba(255,255,255,0.22)') {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      if (len < 0.5) return;
      const nx = -dy / len;
      const ny = dx / len;
      const ang = Math.atan2(dy, dx);
      ctx.save();
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(x1 + nx * r1, y1 + ny * r1);
      ctx.lineTo(x2 + nx * r2, y2 + ny * r2);
      ctx.arc(x2, y2, r2, ang + Math.PI / 2, ang - Math.PI / 2, true);
      ctx.lineTo(x1 - nx * r1, y1 - ny * r1);
      ctx.arc(x1, y1, r1, ang - Math.PI / 2, ang + Math.PI / 2, true);
      ctx.closePath();
      ctx.fill();
      if (highlightColor) {
        ctx.strokeStyle = highlightColor;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(x1 + nx * r1 * 0.62, y1 + ny * r1 * 0.62);
        ctx.lineTo(x2 + nx * r2 * 0.62, y2 + ny * r2 * 0.62);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawJoint(x, y, r, fill, stroke) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
    }

    function drawAthleticTorso2D(hipX, hipY, shX, shY, jerseyColor, trimColor) {
      const dx = shX - hipX;
      const dy = shY - hipY;
      const len = Math.max(1, Math.hypot(dx, dy));
      const nx = -dy / len;
      const ny = dx / len;
      const waistX = hipX + dx * 0.34;
      const waistY = hipY + dy * 0.34;
      const chestX = hipX + dx * 0.72;
      const chestY = hipY + dy * 0.72;

      ctx.save();
      ctx.fillStyle = jerseyColor;
      ctx.beginPath();
      ctx.moveTo(hipX - nx * 8.2, hipY - ny * 8.2);
      ctx.quadraticCurveTo(waistX - nx * 6.8, waistY - ny * 6.8, shX - nx * 11.4, shY - ny * 11.4);
      ctx.quadraticCurveTo(shX, shY - 3, shX + nx * 11.4, shY + ny * 11.4);
      ctx.quadraticCurveTo(waistX + nx * 6.8, waistY + ny * 6.8, hipX + nx * 8.2, hipY + ny * 8.2);
      ctx.closePath();
      ctx.fill();

      // Subtle chest seam + collar V-trim
      ctx.strokeStyle = trimColor;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(shX - nx * 4, shY - ny * 4);
      ctx.lineTo(chestX, chestY);
      ctx.lineTo(shX + nx * 4, shY + ny * 4);
      ctx.stroke();
      ctx.restore();
    }

    function drawFielderGlove2D(gx, gy, accent) {
      ctx.save();
      ctx.translate(gx, gy);
      // Cupped leather glove shell + thumb stall + laced web
      ctx.fillStyle = '#854d0e';
      ctx.beginPath();
      ctx.moveTo(-6, 5);
      ctx.quadraticCurveTo(-9, -4, -3, -9);
      ctx.quadraticCurveTo(3, -11, 8, -5);
      ctx.quadraticCurveTo(10, 3, 4, 8);
      ctx.quadraticCurveTo(-2, 9, -6, 5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Webbing pocket cross-laces
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-2, -6);
      ctx.lineTo(4, -2);
      ctx.moveTo(3, -7);
      ctx.lineTo(-2, -1);
      ctx.stroke();
      ctx.restore();
    }

    function drawArrow(x1, y1, x2, y2, color, dashed = false) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.4;
      if (dashed) ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
      const ang = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - Math.cos(ang - 0.45) * 9, y2 - Math.sin(ang - 0.45) * 9);
      ctx.lineTo(x2 - Math.cos(ang + 0.45) * 9, y2 - Math.sin(ang + 0.45) * 9);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function drawBaseball(x, y, r = 6.5) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x - r * 0.45, y, r * 0.6, -0.9, 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + r * 0.45, y, r * 0.6, Math.PI - 0.9, Math.PI + 0.9);
      ctx.stroke();
      ctx.restore();
    }

    function drawStageBackdrop(x, y, w, h, domain, c) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();

      const bgG = ctx.createLinearGradient(x, y, x, y + h * 0.72);
      bgG.addColorStop(0, c.bgTop);
      bgG.addColorStop(1, c.bgBot);
      ctx.fillStyle = bgG;
      ctx.fillRect(x, y, w, h);

      // Subtle stadium cage grid / trusses
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      for (let gx = x + 36; gx < x + w; gx += 44) {
        ctx.beginPath();
        ctx.moveTo(gx, y);
        ctx.lineTo(gx, y + h * 0.72);
        ctx.stroke();
      }

      // Turf / Dirt ground strip
      const gy = y + h * 0.72;
      ctx.fillStyle = domain === 'hitting' ? c.dirt : c.turf;
      ctx.fillRect(x, gy, w, h - (gy - y));
      if (domain === 'fielding') {
        ctx.fillStyle = 'rgba(0,0,0,0.14)';
        for (let sx = x; sx < x + w; sx += 56) {
          ctx.fillRect(sx, gy, 28, h - (gy - y));
        }
      }
      ctx.strokeStyle = c.line;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + w, gy);
      ctx.stroke();
      ctx.restore();
    }

    function drawThemedBat2D(hx, hy, angle, batId) {
      const themes = {
        'baum-gold': { handle: '#0a0b0e', cuff: '#111318', barrel: '#111318', accent: '#eab308', cap: '#0a0b0e', knob: '#0a0b0e', hi: 'rgba(255,255,255,0.42)' },
        'goods-2026': { handle: '#12141a', cuff: '#1f232c', barrel: '#9beae4', accent: '#ef4444', cap: '#0b0d12', knob: '#12141a', hi: 'rgba(255,255,255,0.6)' },
        'goods-2022': { handle: '#14151a', cuff: '#1e2128', barrel: '#cbd5e1', accent: '#111827', cap: '#0e1015', knob: '#14151a', hi: 'rgba(255,255,255,0.7)' },
        'combat-rodeo': { handle: '#991b1b', cuff: '#f2e3be', barrel: '#f2e3be', accent: '#991b1b', cap: '#f2e3be', knob: '#88131d', hi: 'rgba(255,255,255,0.5)' },
        'combat-blue': { handle: '#9be7fd', cuff: '#87defb', barrel: '#87defb', accent: '#1e3a8a', cap: '#1e3a8a', knob: '#1e3a8a', hi: 'rgba(255,255,255,0.58)' }
      };
      const t = themes[batId] || themes['goods-2026'];
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(angle);
      // Knob
      ctx.fillStyle = t.knob;
      ctx.beginPath();
      ctx.arc(0, 0, 3.8, 0, Math.PI * 2);
      ctx.fill();
      // Handle
      ctx.fillStyle = t.handle;
      ctx.fillRect(2, -2.1, 20, 4.2);
      // Connector / Taper transition
      ctx.fillStyle = t.cuff;
      ctx.fillRect(22, -2.6, 5, 5.2);
      // Taper + Barrel
      ctx.fillStyle = t.barrel;
      ctx.beginPath();
      ctx.moveTo(27, -2.3);
      ctx.lineTo(35, -3.9);
      ctx.lineTo(59, -3.9);
      ctx.lineTo(59, 3.9);
      ctx.lineTo(35, 3.9);
      ctx.lineTo(27, 2.3);
      ctx.closePath();
      ctx.fill();
      // Photo-matched markings
      if (batId === 'baum-gold') {
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.ellipse(34, 0, 5.2, 2.2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (batId === 'goods-2026') {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(42, -3.4, 9, 2.2);
        ctx.fillStyle = '#181a20';
        ctx.fillRect(40, 0.2, 12, 2.2);
      } else if (batId === 'goods-2022') {
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        ctx.arc(49, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (batId === 'combat-rodeo') {
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(39, -1.5, 14, 3);
      } else if (batId === 'combat-blue') {
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(34, -3.9, 1.4, 7.8);
        ctx.fillRect(55, -3.9, 1.4, 7.8);
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.arc(48, 0, 2.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = t.cap;
      ctx.fillRect(57, -3.6, 3.2, 7.2);
      // Specular sheen highlight
      ctx.strokeStyle = t.hi;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(35, -1.9);
      ctx.lineTo(56, -1.9);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Hitter (side/3-quarter view: Pitcher is to the RIGHT (+x), Batter stands on LEFT)
    function renderHittingPanel(x, y, w, h, clinicId, p, isFlaw, c) {
      drawStageBackdrop(x, y, w, h, 'hitting', c);
      const groundY = y + h * 0.72;
      const cx = x + w * 0.44;

      // Home Plate + Tee / Ball reference
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(cx + 38, groundY - 4, 24, 5);

      const accent = isFlaw ? c.flaw : c.pro;
      const jersey = isFlaw ? c.jerseyFlaw : c.jerseyPro;

      // Smooth biomechanical phase easing curves (contact at p = 0.60)
      const load = smoothStep(Math.min(1, p / 0.28));
      const stride = smoothStep(p < 0.24 ? 0 : Math.min(1, (p - 0.24) / 0.20));
      const swing = smoothStep(p < 0.44 ? 0 : Math.min(1, (p - 0.44) / 0.16)); // 1.0 right at contact p = 0.60!
      const finish = smoothStep(p < 0.60 ? 0 : Math.min(1, (p - 0.60) / 0.40));

      // Compute biomechanics offsets by clinic + flaw vs pro
      let hipShiftX = -load * 6 + stride * 11;
      let headDrop = 0;
      let frontKneeBend = 10;
      let rearElbowLead = 0;
      let handCastX = 0;
      let wristRoll = 0;
      let batAngle = -1.95;

      // Exact bat-to-ball contact alignment math:
      // At p=0.60 (swing=1.0, finish=0), handsX ≈ cx + 2, handsY ≈ groundY - 62, ballContact = (cx + 46, groundY - 58)
      // Bat sweet spot is at r = 44.5px along batAngle: (+44.5 * cos(0.09), +44.5 * sin(0.09)) = (+44.3, +4.0) -> EXACT HIT!
      const slotCurve = Math.sin(swing * Math.PI);
      const baseSwingAngle =
        swing < 0.001
          ? -1.95
          : finish > 0
            ? 0.09 - finish * 1.15
            : -1.95 - slotCurve * 0.45 + swing * 2.04;

      if (clinicId === 'lunging') {
        if (isFlaw) {
          hipShiftX += stride * 34 + swing * 12;
          headDrop = stride * 18;
          frontKneeBend = 2; // locked front leg!
          batAngle = baseSwingAngle + 0.16 * swing;
        } else {
          hipShiftX = -load * 7 + stride * 11;
          frontKneeBend = 8 - swing * 6;
          batAngle = baseSwingAngle;
        }
      } else if (clinicId === 'bat-drag') {
        if (isFlaw) {
          rearElbowLead = swing * 28; // elbow shoots way ahead!
          batAngle = swing < 0.001 ? -1.95 : finish > 0 ? -0.45 - finish * 0.65 : -1.95 - slotCurve * 0.55 + swing * 1.5; // barrel drags behind!
        } else {
          rearElbowLead = swing * 5;
          batAngle = baseSwingAngle;
        }
      } else if (clinicId === 'casting') {
        if (isFlaw) {
          handCastX = swing * 28; // hands sweep wide!
          batAngle = baseSwingAngle + swing * 0.24;
        } else {
          handCastX = swing * 4;
          batAngle = baseSwingAngle;
        }
      } else if (clinicId === 'rolling-over') {
        if (isFlaw) {
          wristRoll = swing * 1.15 + finish * 0.55; // top wrist turns over steeply downward!
          batAngle = baseSwingAngle + swing * 0.48 + finish * 0.95;
        } else {
          batAngle = baseSwingAngle;
        }
      } else {
        batAngle = baseSwingAngle;
      }

      // Feet & Legs
      const backFootX = cx - 24;
      const frontFootX = cx + 22 + stride * (clinicId === 'lunging' && isFlaw ? 34 : 10);
      const hipX = cx + hipShiftX;
      const hipY = groundY - 62 + headDrop * 0.55;
      const frontKneeX = (frontFootX + hipX) * 0.5 + frontKneeBend;
      const frontKneeY = groundY - 31 + headDrop * 0.3;
      const backKneeX = (backFootX + hipX) * 0.5 + 4 + swing * 10;
      const backKneeY = groundY - 30;

      // Ground shadow under feet + Cleats + Smooth athletic tapered legs
      ctx.fillStyle = 'rgba(0,0,0,0.34)';
      ctx.beginPath();
      ctx.ellipse((backFootX + frontFootX) * 0.5, groundY - 1, 34, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      drawTaperedLimb(hipX - 5.5, hipY, backKneeX, backKneeY, 6.4, 4.9, c.body);
      drawTaperedLimb(backKneeX, backKneeY, backFootX, groundY - 4, 4.7, 3.2, c.body);
      drawTaperedLimb(hipX + 5.5, hipY, frontKneeX, frontKneeY, 6.4, 4.9, c.body);
      drawTaperedLimb(frontKneeX, frontKneeY, frontFootX, groundY - 4, 4.7, 3.2, c.body);

      // Stirrup stripe & cleats
      drawTaperedLimb(backFootX - 1, groundY - 3.5, backFootX + 9, groundY - 3, 3.0, 2.4, '#0f172a', null);
      drawTaperedLimb(frontFootX - 1, groundY - 3.5, frontFootX + 10, groundY - 3, 3.0, 2.4, '#0f172a', null);

      // Curved Athletic Jersey Torso + Belt
      const shX = hipX - 4 + (clinicId === 'lunging' && isFlaw ? stride * 18 : -swing * 4);
      const shY = hipY - 46 + headDrop * 0.45;
      drawAthleticTorso2D(hipX, hipY, shX, shY, jersey, 'rgba(255,255,255,0.45)');
      drawSegment(hipX - 7, hipY + 1, hipX + 7, hipY + 1, 4.2, '#0f172a');

      // Head, Contoured Batting Helmet, Curved Visor & C-Flap Jaw Guard
      const headX = shX + 3 + (clinicId === 'lunging' && isFlaw ? stride * 8 : 0);
      const headY = shY - 17;
      drawJoint(headX, headY, 9.5, '#e8be96', null);
      ctx.beginPath();
      ctx.arc(headX - 1, headY - 2, 11.4, Math.PI * 0.85, Math.PI * 2.08);
      ctx.fillStyle = jersey;
      ctx.fill();
      // Curved visor bill & C-flap
      ctx.strokeStyle = jersey;
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(headX + 5, headY - 3);
      ctx.quadraticCurveTo(headX + 12, headY - 3.5, headX + 16, headY - 1);
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(headX + 1, headY + 0.5, 6.5, 4.5, 2);
      ctx.fill();

      // Fence visual for Casting Wall Drill + Red Barrel Loop Arc vs Compact Inside Path!
      if (clinicId === 'casting') {
        ctx.strokeStyle = 'rgba(248, 250, 252, 0.45)';
        ctx.lineWidth = 3.2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(cx - 46, groundY - 140);
        ctx.lineTo(cx - 46, groundY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '700 9px "IBM Plex Mono", monospace';
        ctx.fillText('FENCE', cx - 64, groundY - 126);
      }

      // Arms, Rear Elbow & Hands — drop cleanly into the slot so bat sweet spot meets ballContactX/Y at p=0.60!
      const backShoulderX = shX - 6;
      const backShoulderY = shY + 5;
      const frontShoulderX = shX + 7;
      const frontShoulderY = shY + 5;

      const baseHandsX = shX - 5 + swing * 12 - load * 6 + finish * 6;
      const baseHandsY = shY + 12 + swing * 34 - finish * 18;
      const handsX = baseHandsX + handCastX - (clinicId === 'bat-drag' && isFlaw ? swing * 12 : 0);
      const handsY = baseHandsY + wristRoll * 5;

      const rearElbowX = backShoulderX - 4 + rearElbowLead + swing * 9;
      const rearElbowY = backShoulderY + 18 + swing * 14 + (clinicId === 'bat-drag' && !isFlaw ? 5 : 0);

      drawTaperedLimb(backShoulderX, backShoulderY, rearElbowX, rearElbowY, 4.1, 3.3, jersey);
      drawTaperedLimb(rearElbowX, rearElbowY, handsX, handsY, 3.2, 2.7, '#fed7aa', null);
      drawTaperedLimb(frontShoulderX, frontShoulderY, (frontShoulderX + handsX) * 0.5, (frontShoulderY + handsY) * 0.5 + 3, 3.8, 3.1, jersey);
      drawTaperedLimb((frontShoulderX + handsX) * 0.5, (frontShoulderY + handsY) * 0.5 + 3, handsX, handsY, 3.0, 2.5, '#fed7aa', null);

      // Biomechanical Flaw vs Pro Coaching Vector Overlays per Clinic
      ctx.save();
      if (clinicId === 'bat-drag') {
        drawJoint(rearElbowX, rearElbowY, 6.2, accent, '#ffffff');
        if (isFlaw) {
          // Red horizontal elbow-drag vector showing elbow beating the hands & stranding the barrel behind!
          drawArrow(rearElbowX - 10, rearElbowY - 12, rearElbowX + 18, rearElbowY - 12, c.flaw, false);
          ctx.fillStyle = c.flaw;
          ctx.font = '700 9px "IBM Plex Mono", monospace';
          ctx.fillText('ELBOW DRAGS AHEAD', Math.max(x + 8, rearElbowX - 38), rearElbowY - 18);
          if (swing > 0.2) {
            ctx.strokeStyle = 'rgba(248, 113, 113, 0.72)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.moveTo(rearElbowX, rearElbowY);
            ctx.lineTo(handsX, handsY);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        } else {
          // Pro Hip Slot target ring + stacked forearm-above-elbow connection guide
          ctx.strokeStyle = c.pro;
          ctx.lineWidth = 1.8;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(hipX + 4, hipY - 14, 12, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = c.pro;
          ctx.font = '700 9px "IBM Plex Mono", monospace';
          ctx.fillText('HIP SLOT', hipX - 24, hipY + 10);
        }
      } else if (clinicId === 'casting') {
        drawJoint(handsX, handsY, 6.2, accent, '#ffffff');
        if (isFlaw) {
          // Wide circular outside casting arc crashing through the wall
          ctx.strokeStyle = 'rgba(248, 113, 113, 0.75)';
          ctx.lineWidth = 2.6;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(shX - 8, shY + 12);
          ctx.quadraticCurveTo(cx - 56, shY + 10, cx + 18, groundY - 58);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.moveTo(cx - 53, groundY - 88);
          ctx.lineTo(cx - 39, groundY - 74);
          ctx.moveTo(cx - 39, groundY - 88);
          ctx.lineTo(cx - 53, groundY - 74);
          ctx.stroke();
          ctx.fillStyle = c.flaw;
          ctx.font = '700 9px "IBM Plex Mono", monospace';
          ctx.fillText('WIDE LOOP', cx - 78, groundY - 96);
        } else {
          // Tight direct inside-the-ball knob rail
          drawArrow(shX - 2, shY + 16, cx + 16, groundY - 58, c.pro, true);
          ctx.fillStyle = c.pro;
          ctx.font = '700 9px "IBM Plex Mono", monospace';
          ctx.fillText('KNOB INSIDE BALL', cx - 10, shY + 6);
        }
      } else if (clinicId === 'rolling-over') {
        drawJoint(handsX, handsY, 6.2, accent, '#ffffff');
        if (isFlaw) {
          // Steep -12° downward chop line into ground
          drawArrow(handsX + 4, handsY - 8, cx + 62, groundY - 12, c.flaw, false);
          ctx.fillStyle = c.flaw;
          ctx.font = '700 9px "IBM Plex Mono", monospace';
          ctx.fillText('-12° TOP-HAND CHOP', cx + 14, groundY - 40);
        } else {
          // +10° upward attack plane tunnel + 8" extension rail past plate
          ctx.fillStyle = 'rgba(34, 197, 94, 0.16)';
          ctx.beginPath();
          ctx.moveTo(cx + 8, groundY - 54);
          ctx.lineTo(cx + 76, groundY - 78);
          ctx.lineTo(cx + 76, groundY - 62);
          ctx.lineTo(cx + 8, groundY - 46);
          ctx.closePath();
          ctx.fill();
          drawArrow(cx + 12, groundY - 52, cx + 74, groundY - 70, c.pro, false);
          ctx.fillStyle = c.pro;
          ctx.font = '700 9px "IBM Plex Mono", monospace';
          ctx.fillText('+10° PALM UP/DOWN', cx + 8, groundY - 82);
        }
      } else if (clinicId === 'lunging') {
        drawJoint(frontKneeX, frontKneeY, 6.2, accent, '#ffffff');
        // Head Plumb Line anchored at stance x
        const stanceHeadX = cx - 4;
        ctx.strokeStyle = isFlaw ? 'rgba(248, 113, 113, 0.6)' : 'rgba(34, 197, 94, 0.72)';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(stanceHeadX, shY - 34);
        ctx.lineTo(stanceHeadX, groundY);
        ctx.stroke();
        ctx.setLineDash([]);
        if (isFlaw) {
          if (headX - stanceHeadX > 10) {
            drawArrow(stanceHeadX, headY - 16, headX, headY - 16, c.flaw, false);
          }
          ctx.fillStyle = c.flaw;
          ctx.font = '700 9px "IBM Plex Mono", monospace';
          ctx.fillText('HEAD DRIFT + LOCKED KNEE', stanceHeadX - 18, shY - 38);
        } else {
          drawArrow(frontKneeX, frontKneeY + 12, frontKneeX - 4, hipY + 4, c.pro, true);
          ctx.fillStyle = c.pro;
          ctx.font = '700 9px "IBM Plex Mono", monospace';
          ctx.fillText('QUIET HEAD · FIRM BLOCK', stanceHeadX - 24, shY - 38);
        }
      }
      ctx.restore();

      // Translucent Bat Swing Arc Ribbon Trail
      if (swing > 0.08 && finish < 0.85) {
        ctx.save();
        ctx.strokeStyle = isFlaw ? 'rgba(248, 113, 113, 0.34)' : 'rgba(56, 189, 248, 0.42)';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(handsX, handsY, 46, Math.max(-2.35, batAngle - 1.15 * swing), batAngle);
        ctx.stroke();
        ctx.restore();
      }

      // 3D-Styled Actual Theme Bat (Baum Bat Gold / 2026 Goods / 2022 Goods / Combat Rodeo / Combat Blue)
      drawThemedBat2D(handsX, handsY, batAngle, c.activeBatId || 'goods-2026');

      // Incoming & Batted Ball Trajectory (Exact Bat-Ball Collision at contactP = 0.60!)
      const contactP = 0.60;
      const ballContactX = cx + 46;
      const ballContactY = groundY - 58;
      if (p <= contactP) {
        const t = p / contactP;
        const bx = x + w - 24 + (ballContactX - (x + w - 24)) * t;
        const by = ballContactY - 8 + Math.sin(t * Math.PI) * 6;
        drawBaseball(bx, by, 6);
      } else {
        const t = (p - contactP) / (1 - contactP);
        // Contact impact flash ring right when barrel strikes the ball!
        if (t < 0.22) {
          ctx.save();
          ctx.strokeStyle = isFlaw ? c.flaw : '#fde047';
          ctx.globalAlpha = 1 - t / 0.22;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(ballContactX, ballContactY, 7 + t * 85, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        // Pro swings send crisp elevated backspin line drive; Flaw swings send weak grounders or pop-ups!
        const endBx = x + w - 18;
        let endBy = ballContactY - 78;
        if (isFlaw) {
          endBy = clinicId === 'rolling-over' ? groundY - 6 : clinicId === 'lunging' ? groundY - 4 : ballContactY - 105;
        }
        const bx = ballContactX + (endBx - ballContactX) * t;
        const by = ballContactY + (endBy - ballContactY) * t - (isFlaw && clinicId === 'casting' ? Math.sin(t * Math.PI) * 35 : 0);

        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(ballContactX, ballContactY);
        ctx.lineTo(bx, by);
        ctx.stroke();
        ctx.setLineDash([]);
        drawBaseball(bx, by, 6);
      }

      // Live Vector Callout Badge inside panel
      drawTagOverlay(x, y, w, isFlaw ? 'COMMON FLAW' : 'PRO MECHANIC', isFlaw ? c.flaw : c.pro, getSwingNote(clinicId, isFlaw, p));
    }

    function getSwingNote(id, isFlaw, p) {
      if (id === 'bat-drag') return isFlaw ? 'Elbow passes hands · Barrel drags' : 'Elbow slots near hip · Crisp snap';
      if (id === 'casting') return isFlaw ? 'Hands sweep out · Hits fence' : 'Compact knob path inside ball';
      if (id === 'rolling-over') return isFlaw ? 'Top wrist rolls early · Grounder' : 'Palm-Up / Palm-Down extension';
      return isFlaw ? 'Head dives + knee locks early' : 'Back-hip coil + firm front block';
    }

    // Draw Infield/Outfield Mechanics Panel
    function renderFieldingPanel(x, y, w, h, clinicId, p, isFlaw, c) {
      drawStageBackdrop(x, y, w, h, 'fielding', c);
      const groundY = y + h * 0.72;
      const accent = isFlaw ? c.flaw : c.pro;
      const jersey = isFlaw ? c.jerseyFlaw : c.jerseyPro;

      if (clinicId === 'banana-route') {
        // Top-down / elevated Outfield View for Route Angles!
        ctx.fillStyle = c.turf;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        for (let sx = x; sx < x + w; sx += 38) {
          ctx.fillStyle = 'rgba(0,0,0,0.12)';
          ctx.fillRect(sx, y, 19, h);
        }

        const startX = x + w * 0.25;
        const startY = y + h * 0.72;
        const targetX = x + w * 0.80;
        const targetY = y + h * 0.24;

        // Pro straight line vs Flaw curved banana arc!
        ctx.strokeStyle = accent;
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        if (isFlaw) {
          ctx.quadraticCurveTo(x + w * 0.30, y + h * 0.20, targetX, targetY);
        } else {
          ctx.lineTo(targetX, targetY);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated Fielder Dot + Glove along path
        const t = Math.min(1, p / 0.85);
        let fx, fy;
        if (isFlaw) {
          const u = 1 - t;
          const cx0 = x + w * 0.30;
          const cy0 = y + h * 0.20;
          fx = u * u * startX + 2 * u * t * cx0 + t * t * targetX;
          fy = u * u * startY + 2 * u * t * cy0 + t * t * targetY;
        } else {
          fx = startX + (targetX - startX) * t;
          fy = startY + (targetY - startY) * t;
        }

        // Fielder shoulder + cap icon
        drawJoint(fx, fy, 11, jersey, '#ffffff');
        drawJoint(fx, fy - 2, 5.5, '#0f172a', null);
        // Landing Spot X + Ball falling
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(targetX - 7, targetY - 7);
        ctx.lineTo(targetX + 7, targetY + 7);
        ctx.moveTo(targetX + 7, targetY - 7);
        ctx.lineTo(targetX - 7, targetY + 7);
        ctx.stroke();

        const ballT = Math.min(1, p / 0.9);
        const bx = x + w * 0.12 + (targetX - x - w * 0.12) * ballT;
        const by = y + h * 0.88 + (targetY - (y + h * 0.88)) * ballT - Math.sin(ballT * Math.PI) * 58;
        drawBaseball(bx, by, 5.5 + Math.sin(ballT * Math.PI) * 2.5);

        drawTagOverlay(
          x,
          y,
          w,
          isFlaw ? 'COMMON FLAW' : 'PRO MECHANIC',
          accent,
          isFlaw ? 'Banana arc loses range & time' : '45° drop-step · Straight line to X'
        );
        return;
      }

      // Ground-level Athletic Fielding Rig (glove-stab, footwork-cadence, crow-hop)
      let fx = x + w * 0.32 + p * 85;
      let crouch = 0;
      let hopY = 0;
      let gloveOut = 28;
      let armAngle = -0.3;

      if (clinicId === 'glove-stab') {
        fx = x + w * 0.44 + Math.min(1, p * 1.4) * 20;
        const catchT = Math.min(1, p / 0.58);
        const funnelT = p < 0.58 ? 0 : Math.min(1, (p - 0.58) / 0.32);
        crouch = 24;
        if (isFlaw) {
          gloveOut = 8; // deep between feet!
          if (p > 0.45 && p < 0.62) crouch -= 8; // stabs down stiffly
        } else {
          gloveOut = 32 - funnelT * 22; // catches out front then funnels cleanly to chest!
        }
        // Incoming Grounder Ball from right
        if (p <= 0.58) {
          const bt = catchT;
          const bx = x + w - 20 + (fx + gloveOut - (x + w - 20)) * bt;
          const bounce = Math.abs(Math.sin(bt * Math.PI * 2.5)) * 18 * (1 - bt * 0.4);
          drawBaseball(bx, groundY - 6 - bounce, 6);
        } else {
          drawBaseball(fx + gloveOut, groundY - 46 - funnelT * 18, 5.5);
        }
      } else if (clinicId === 'footwork-cadence') {
        const moveT = Math.min(1, p / 0.68);
        fx = isFlaw ? x + w * 0.44 : x + w * 0.25 + moveT * 95;
        crouch = isFlaw ? 10 : 24 * (1 - Math.max(0, (p - 0.65) * 2.5));
        gloveOut = isFlaw ? 12 : 30 - Math.max(0, (p - 0.55) * 40);
        if (!isFlaw) {
          drawArrow(x + w * 0.24, groundY + 14, x + w * 0.72, groundY + 14, c.pro, true);
        }
        const bx = p < 0.55 ? x + w - 24 + (fx + gloveOut - (x + w - 24)) * (p / 0.55) : fx + 12 + Math.max(0, (p - 0.68) * 320);
        const by = p < 0.55 ? groundY - 8 : groundY - 68 - Math.max(0, (p - 0.68) * 18);
        drawBaseball(bx, by, 6);
      } else if (clinicId === 'crow-hop') {
        const catchP = 0.36;
        const hopP = 0.68;
        fx = x + w * 0.22 + p * 120;
        if (p > catchP && p < hopP) {
          const hp = (p - catchP) / (hopP - catchP);
          // FLAW: High vertical basketball jump; PRO: Low skimming linear momentum skip!
          hopY = isFlaw ? Math.sin(hp * Math.PI) * 38 : Math.sin(hp * Math.PI) * 9;
        }
        armAngle = p < hopP ? -0.4 : -0.4 + ((p - hopP) / 0.32) * 2.2;
        if (p < catchP) {
          const bt = p / catchP;
          drawBaseball(x + w * 0.75 + (fx + 22 - x - w * 0.75) * bt, y + 36 + (groundY - 76 - (y + 36)) * bt, 6);
        } else if (p > 0.76) {
          const tt = (p - 0.76) / 0.24;
          const bx = fx + 24 + tt * 165;
          const by = isFlaw ? groundY - 82 - Math.sin(tt * Math.PI) * 45 : groundY - 72 + tt * 16;
          drawArrow(fx + 24, groundY - 72, Math.min(x + w - 18, bx), by, accent, false);
          drawBaseball(bx, by, 6);
        }
      }

      // Draw Smooth Anatomical Fielder Body + Curved Jersey + Sculpted Glove
      const hipY = groundY - 56 + crouch * 0.65 - hopY;
      const shY = hipY - 40 + crouch * 0.3;
      const shX = fx + crouch * 0.25;
      drawTaperedLimb(fx, hipY, fx - 6, groundY - 28 - hopY, 5.8, 4.5, c.body);
      drawTaperedLimb(fx - 6, groundY - 28 - hopY, fx - 16, groundY - 4 - hopY, 4.3, 3.0, c.body);
      drawTaperedLimb(fx, hipY, fx + 10, groundY - 28 - hopY, 5.8, 4.5, c.body);
      drawTaperedLimb(fx + 10, groundY - 28 - hopY, fx + 14, groundY - 4 - hopY, 4.3, 3.0, c.body);
      drawAthleticTorso2D(fx, hipY, shX, shY, jersey, 'rgba(255,255,255,0.42)');

      // Head + Contoured Cap + Curved Bill
      drawJoint(shX + 3, shY - 16, 9.5, '#fed7aa', null);
      ctx.beginPath();
      ctx.arc(shX + 2, shY - 18, 10.6, Math.PI * 0.9, Math.PI * 2.05);
      ctx.fillStyle = jersey;
      ctx.fill();
      ctx.strokeStyle = jersey;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(shX + 6, shY - 19);
      ctx.quadraticCurveTo(shX + 13, shY - 19.5, shX + 17, shY - 17);
      ctx.stroke();

      // Glove & Throwing Arm
      const gx = shX + gloveOut;
      const gy = clinicId === 'crow-hop' ? shY + 6 : groundY - 16 - (clinicId === 'glove-stab' && !isFlaw ? 2 : 0) - hopY;
      drawTaperedLimb(shX + 4, shY + 5, gx, gy, 3.6, 2.8, jersey);
      drawFielderGlove2D(gx, gy, accent);
      if (clinicId === 'crow-hop') {
        const tx = shX - 6 + Math.cos(armAngle) * 26;
        const ty = shY + 4 + Math.sin(armAngle) * 26;
        drawTaperedLimb(shX - 4, shY + 5, tx, ty, 3.4, 2.5, '#fed7aa', null);
      }

      const fieldNote =
        clinicId === 'glove-stab'
          ? isFlaw ? 'Hands deep under chest · Stiff stab' : 'Triangle out front -> smooth chest funnel'
          : clinicId === 'footwork-cadence'
            ? isFlaw ? 'Glued flat heels · All-arm throw' : 'Right-Left-Catch-Right-Throw rhythm'
            : isFlaw ? 'Vertical jump kills throw carry' : 'Low linear skip keeps chest downhill';

      drawTagOverlay(x, y, w, isFlaw ? 'COMMON FLAW' : 'PRO MECHANIC', accent, fieldNote);
    }

    function drawTagOverlay(x, y, w, badge, accent, caption) {
      ctx.fillStyle = 'rgba(10, 18, 32, 0.84)';
      ctx.fillRect(x + 12, y + 12, Math.min(w - 24, 240), 46);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(x + 12, y + 12, Math.min(w - 24, 240), 46);

      ctx.fillStyle = accent;
      ctx.font = '700 10.5px "IBM Plex Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(badge, x + 22, y + 29);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(caption, x + 22, y + 48);
    }

    function render(clinic, progress, viewMode, batId = 'goods-2026') {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pw = Math.round(W * dpr);
      const ph = Math.round(H * dpr);
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const c = getThemeColors();
      c.activeBatId = batId;

      const p = ((progress % 1) + 1) % 1;
      const fn = clinic.domain === 'hitting' ? renderHittingPanel : renderFieldingPanel;

      if (viewMode === 'split') {
        const half = W / 2 - 2;
        fn(0, 0, half, H, clinic.id, p, true, c);
        fn(half + 4, 0, half, H, clinic.id, p, false, c);
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fillRect(half, 0, 4, H);
      } else if (viewMode === 'flaw') {
        fn(0, 0, W, H, clinic.id, p, true, c);
      } else {
        fn(0, 0, W, H, clinic.id, p, false, c);
      }

      // Bottom Video Stage Progress Bar
      const stageIdx = Math.min(3, Math.floor(p * 4));
      ctx.fillStyle = 'rgba(10, 18, 32, 0.86)';
      ctx.fillRect(14, H - 38, W - 28, 26);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 11px "IBM Plex Mono", monospace';
      ctx.textAlign = 'left';
      const batLabel = clinic.domain === 'hitting' && BAT_RECOMMENDATIONS[batId] ? ` · ${BAT_RECOMMENDATIONS[batId].name}` : '';
      ctx.fillText(`FRAME STAGE: ${clinic.stages[stageIdx]}${batLabel}`, 24, H - 21);

      ctx.fillStyle = '#cbd5e1';
      ctx.textAlign = 'right';
      ctx.fillText(`${(p * 4.2).toFixed(1)}s / 4.2s`, W - 24, H - 21);
    }

    return { render };
  }

  /* =========================================================
     Training Lab Page Controller
     ========================================================= */
  async function initTrainingPage() {
    const root = document.getElementById('training-lab');
    if (!root) return;

    // 1. Video Clinic Controls
    const clinicListEl = document.getElementById('clinic-video-list');
    const videoCanvas = document.getElementById('clinic-video-canvas');
    const modeTabsEl = document.getElementById('video-mode-tabs');
    const playBtn = document.getElementById('video-play-btn');
    const restartBtn = document.getElementById('video-restart-btn');
    const speedBtn = document.getElementById('video-speed-btn');
    const seekInput = document.getElementById('video-seek-bar');
    const chapterTabsEl = document.getElementById('video-chapter-tabs');
    const domainFilterEl = document.getElementById('clinic-domain-filter');

    const titleEl = document.getElementById('clinic-active-title');
    const metaEl = document.getElementById('clinic-active-meta');
    const summaryEl = document.getElementById('clinic-active-summary');
    const drillsWrapEl = document.getElementById('clinic-drills-wrap');
    const saveDrillBtn = document.getElementById('save-clinic-drill-btn');
    const playLinkEl = document.getElementById('clinic-play-link');
    const cageLinkEl = document.getElementById('clinic-cage-link');
    const liveStageTitleEl = document.getElementById('clinic-live-stage-title');
    const liveStageBadgeEl = document.getElementById('clinic-live-stage-badge');
    const liveStageCueEl = document.getElementById('clinic-live-stage-cue');
    const howToStepsEl = document.getElementById('clinic-howto-steps');
    const batSelectEl = document.getElementById('clinic-bat-select');

    let activeClinic = VIDEO_CLINICS[0];
    let activeBatId = 'goods-2026';
    let domainFilter = 'all';
    let viewMode = 'split'; // 'split' | 'pro' | 'flaw'
    let playing = true;
    let slowMo = false;
    let progress = 0;
    let lastTs = 0;
    let lastSyncedStage = -1;
    let lastSyncedClinicId = '';
    const renderer = videoCanvas ? createVideoRenderer(videoCanvas) : null;

    function syncStageGuide(force = false) {
      const idx = Math.min(3, Math.floor((((progress % 1) + 1) % 1) * 4));
      if (!force && idx === lastSyncedStage && activeClinic.id === lastSyncedClinicId) return;
      lastSyncedStage = idx;
      lastSyncedClinicId = activeClinic.id;
      const stageName = (activeClinic.stages && activeClinic.stages[idx]) || `Stage ${idx + 1}`;
      const cue = (activeClinic.stageCues && activeClinic.stageCues[idx]) || activeClinic.fixCue;
      if (liveStageTitleEl) liveStageTitleEl.textContent = stageName;
      if (liveStageBadgeEl) liveStageBadgeEl.textContent = `Frame ${idx + 1} / 4`;
      if (liveStageCueEl) liveStageCueEl.textContent = cue;
    }

    function renderClinicButtons() {
      if (!clinicListEl) return;
      const items = VIDEO_CLINICS.filter((c) => domainFilter === 'all' || c.domain === domainFilter);
      clinicListEl.innerHTML = items
        .map(
          (c) => `
          <button type="button" class="clinic-item-btn" data-clinic-id="${c.id}" aria-pressed="${c.id === activeClinic.id}">
            <span class="clinic-item-kicker">${c.domainLabel}</span>
            <span class="clinic-item-title">${c.title}</span>
          </button>`
        )
        .join('');
    }

    function selectClinic(id, autoPlay = false) {
      const found = CLINIC_BY_ID[id];
      if (!found) return;
      activeClinic = found;
      if (found.batId) {
        activeBatId = found.batId;
        if (batSelectEl) batSelectEl.value = activeBatId;
      }
      progress = 0;
      if (autoPlay) playing = true;
      if (playBtn) playBtn.textContent = playing ? 'Pause' : 'Play';
      if (metaEl) metaEl.textContent = `${found.domainLabel} · Fix: ${found.flawName}`;
      if (titleEl) titleEl.textContent = found.title;
      if (summaryEl) summaryEl.textContent = `${found.summary} Pro cue: "${found.fixCue}"`;
      if (playLinkEl) playLinkEl.href = `detail.html?id=${encodeURIComponent(found.scenarioId)}`;
      if (cageLinkEl) cageLinkEl.href = `index.html?bat=${encodeURIComponent(activeBatId)}#gameday-studio`;

      if (howToStepsEl && Array.isArray(found.howToSteps)) {
        howToStepsEl.innerHTML = found.howToSteps.map((step) => `<li>${step}</li>`).join('');
      }
      syncStageGuide(true);

      if (chapterTabsEl) {
        chapterTabsEl.innerHTML = found.stages
          .map(
            (st, idx) =>
              `<button type="button" class="segmented-btn" data-chapter-idx="${idx}" aria-pressed="${idx === 0}">${st}</button>`
          )
          .join('');
      }

      if (drillsWrapEl) {
        drillsWrapEl.innerHTML = found.drills
          .map(
            (d) => `
            <div class="drill-mini-card">
              <div class="meta-line">${d.reps}</div>
              <h4>${d.name}</h4>
              <p style="margin-bottom:0.35rem;color:var(--text-secondary);font-size:0.9rem;"><strong>Setup:</strong> ${d.setup}</p>
              <p style="margin-bottom:0;color:var(--accent);font-size:0.88rem;font-weight:600;">Cue: ${d.cue}</p>
            </div>`
          )
          .join('');
      }

      renderClinicButtons();
      if (renderer) renderer.render(activeClinic, progress, viewMode, activeBatId);
    }

    if (batSelectEl) {
      batSelectEl.addEventListener('change', () => {
        activeBatId = batSelectEl.value;
        if (cageLinkEl) cageLinkEl.href = `index.html?bat=${encodeURIComponent(activeBatId)}#gameday-studio`;
        if (renderer) renderer.render(activeClinic, progress, viewMode, activeBatId);
      });
    }

    if (domainFilterEl) {
      domainFilterEl.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-domain]');
        if (!btn) return;
        domainFilter = btn.dataset.domain;
        domainFilterEl.querySelectorAll('[data-domain]').forEach((b) => {
          b.setAttribute('aria-pressed', String(b.dataset.domain === domainFilter));
        });
        renderClinicButtons();
      });
    }

    if (clinicListEl) {
      clinicListEl.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-clinic-id]');
        if (!btn) return;
        selectClinic(btn.dataset.clinicId, true);
      });
    }

    if (modeTabsEl) {
      modeTabsEl.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-vmode]');
        if (!btn) return;
        viewMode = btn.dataset.vmode;
        modeTabsEl.querySelectorAll('[data-vmode]').forEach((b) => {
          b.setAttribute('aria-pressed', String(b.dataset.vmode === viewMode));
        });
        if (renderer) renderer.render(activeClinic, progress, viewMode, activeBatId);
      });
    }

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        playing = !playing;
        playBtn.textContent = playing ? 'Pause' : 'Play';
      });
    }

    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        progress = 0;
        playing = true;
        if (playBtn) playBtn.textContent = 'Pause';
      });
    }

    if (speedBtn) {
      speedBtn.addEventListener('click', () => {
        slowMo = !slowMo;
        speedBtn.setAttribute('aria-pressed', String(slowMo));
        speedBtn.textContent = slowMo ? 'Speed: 0.45x Slow-Mo' : 'Speed: 1.0x Live';
      });
    }

    if (seekInput) {
      seekInput.addEventListener('input', () => {
        playing = false;
        if (playBtn) playBtn.textContent = 'Play';
        progress = Number(seekInput.value) / 100;
        syncStageGuide();
        if (renderer) renderer.render(activeClinic, progress, viewMode, activeBatId);
      });
    }

    if (chapterTabsEl) {
      chapterTabsEl.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-chapter-idx]');
        if (!btn) return;
        const idx = Number(btn.dataset.chapterIdx);
        playing = false;
        if (playBtn) playBtn.textContent = 'Play';
        progress = idx * 0.25 + 0.08;
        if (seekInput) seekInput.value = String(Math.round(progress * 100));
        chapterTabsEl.querySelectorAll('[data-chapter-idx]').forEach((b) => {
          b.setAttribute('aria-pressed', String(Number(b.dataset.chapterIdx) === idx));
        });
        syncStageGuide(true);
        if (renderer) renderer.render(activeClinic, progress, viewMode, activeBatId);
      });
    }

    function authHeaders(extra = {}) {
      if (window.diamondiqAuth && typeof window.diamondiqAuth.getHeaders === 'function') {
        return window.diamondiqAuth.getHeaders(extra);
      }
      return { ...extra };
    }

    if (saveDrillBtn) {
      let savingDrill = false;
      saveDrillBtn.addEventListener('click', async () => {
        if (savingDrill) return;
        savingDrill = true;
        saveDrillBtn.disabled = true;
        saveDrillBtn.classList.add('is-loading');
        saveDrillBtn.textContent = 'Saving Drill...';
        const title = `Drill Fix: ${activeClinic.title}`;
        const body = `${activeClinic.fixCue}\nDrills:\n- ${activeClinic.drills.map((d) => `${d.name} (${d.reps}): ${d.cue}`).join('\n- ')}`;
        try {
          const res = await fetch('/api/playbook', {
            method: 'POST',
            credentials: 'same-origin',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ title, body, rating: 4 })
          });
          if (res.status === 401) {
            saveDrillBtn.textContent = 'Log in to save to Playbook...';
            setTimeout(() => {
              window.location.href = 'login.html?next=training.html';
            }, 850);
            return;
          }
          if (!res.ok) throw new Error('Could not save');
          saveDrillBtn.textContent = 'Saved to My Playbook!';
          setTimeout(() => {
            saveDrillBtn.textContent = 'Save Drill to My Playbook';
            saveDrillBtn.disabled = false;
          }, 2200);
        } catch {
          saveDrillBtn.textContent = 'Could not save right now';
          saveDrillBtn.disabled = false;
        } finally {
          savingDrill = false;
          saveDrillBtn.classList.remove('is-loading');
        }
      });
    }

    function tickVideo(ts) {
      const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016;
      lastTs = ts;
      if (playing && renderer) {
        const clipDuration = slowMo ? 9.2 : 4.2;
        progress = (progress + dt / clipDuration) % 1;
        if (seekInput) seekInput.value = String(Math.round(progress * 100));
        if (chapterTabsEl) {
          const activeCh = Math.min(3, Math.floor(progress * 4));
          chapterTabsEl.querySelectorAll('[data-chapter-idx]').forEach((b) => {
            b.setAttribute('aria-pressed', String(Number(b.dataset.chapterIdx) === activeCh));
          });
        }
        syncStageGuide();
        renderer.render(activeClinic, progress, viewMode, activeBatId);
      }
      requestAnimationFrame(tickVideo);
    }

    const qp = new URLSearchParams(window.location.search);
    const initialClinicId = qp.get('clinic');
    const initialBatId = qp.get('bat');
    const initialSlow = qp.get('slow') === '1' || qp.get('slow') === 'true';
    const targetClinic = initialClinicId && CLINIC_BY_ID[initialClinicId] ? initialClinicId : VIDEO_CLINICS[0].id;

    if (initialSlow) {
      slowMo = true;
      if (speedBtn) {
        speedBtn.setAttribute('aria-pressed', 'true');
        speedBtn.textContent = 'Speed: 0.45x Slow-Mo';
      }
    }

    selectClinic(targetClinic, initialSlow || Boolean(initialClinicId));

    if (initialBatId && BAT_RECOMMENDATIONS[initialBatId]) {
      activeBatId = initialBatId;
      if (batSelectEl) batSelectEl.value = initialBatId;
      if (renderer) renderer.render(activeClinic, progress, viewMode, activeBatId);
    }

    requestAnimationFrame(tickVideo);

    /* =========================================================
       2. 20-Question Flaw Diagnostic Quiz & Tailored Coaching Plan
       ========================================================= */
    const quizListEl = document.getElementById('diagnostic-quiz-list');
    const quizProgressBar = document.getElementById('quiz-progress-bar');
    const quizProgressText = document.getElementById('quiz-progress-text');
    const quizPartTabs = document.getElementById('quiz-part-tabs');
    const quizSubmitBtn = document.getElementById('quiz-analyze-btn');
    const quizSampleBtn = document.getElementById('quiz-sample-btn');
    const quizClearBtn = document.getElementById('quiz-clear-btn');
    const quizErrorEl = document.getElementById('quiz-error-banner');
    const reportWrapEl = document.getElementById('quiz-report-panel');

    const answers = {};
    let partFilter = 'all';

    function updateProgressUi() {
      const count = Object.keys(answers).length;
      const pct = Math.round((count / QUIZ_QUESTIONS.length) * 100);
      const hitDone = QUIZ_QUESTIONS.filter((q) => q.part === 'hitting' && answers[q.id]).length;
      const fieldDone = QUIZ_QUESTIONS.filter((q) => q.part === 'fielding' && answers[q.id]).length;
      if (quizProgressText) {
        quizProgressText.textContent = `${count} / ${QUIZ_QUESTIONS.length} answered (${pct}%) · Hitting ${hitDone}/10 · Fielding ${fieldDone}/10`;
      }
      if (quizProgressBar) quizProgressBar.style.width = `${pct}%`;
    }

    function renderQuizQuestions() {
      if (!quizListEl) return;
      const visible = QUIZ_QUESTIONS.filter((q) => partFilter === 'all' || q.part === partFilter);
      quizListEl.innerHTML = visible
        .map((q) => {
          const picked = answers[q.id];
          return `
            <fieldset class="quiz-q-card${picked ? ' is-answered' : ''}" data-qid="${q.id}">
              <legend class="quiz-q-title">
                <span class="quiz-q-num tabular-nums">Q${String(q.id).padStart(2, '0')}</span>
                <span>${q.prompt}</span>
              </legend>
              <div class="quiz-q-meta">${q.partLabel}${picked ? ' · Answered' : ''}</div>
              <div class="quiz-options-grid">
                ${q.options
                  .map(
                    (opt) => `
                    <label class="quiz-opt-label${picked === opt.key ? ' is-selected' : ''}">
                      <input type="radio" name="diag-q-${q.id}" value="${opt.key}" ${picked === opt.key ? 'checked' : ''}>
                      <span>${opt.text}</span>
                    </label>`
                  )
                  .join('')}
              </div>
            </fieldset>`;
        })
        .join('');
      updateProgressUi();
    }

    function computeDiagnosticReport() {
      const scores = {
        'bat-drag': 0,
        casting: 0,
        'rolling-over': 0,
        lunging: 0,
        'glove-stab': 0,
        'footwork-cadence': 0,
        'banana-route': 0,
        'crow-hop': 0,
        healthyHit: 0,
        healthyField: 0
      };

      for (const q of QUIZ_QUESTIONS) {
        const pickedKey = answers[q.id];
        const opt = q.options.find((o) => o.key === pickedKey);
        if (!opt) continue;
        for (const [k, v] of Object.entries(opt.weights)) {
          scores[k] = (scores[k] || 0) + v;
        }
      }

      const hittingIds = ['bat-drag', 'casting', 'rolling-over', 'lunging'];
      const fieldingIds = ['glove-stab', 'footwork-cadence', 'banana-route', 'crow-hop'];

      const sortedHit = [...hittingIds].sort((a, b) => scores[b] - scores[a]);
      const sortedField = [...fieldingIds].sort((a, b) => scores[b] - scores[a]);

      const topHitId = sortedHit[0];
      const secHitId = sortedHit[1];
      const topFieldId = sortedField[0];
      const secFieldId = sortedField[1];

      const pillarMetrics = [
        {
          label: 'Swing Connection & Hands',
          score: Math.max(25, Math.min(98, 86 - scores['bat-drag'] * 4 + scores.healthyHit * 1.2))
        },
        {
          label: 'Swing Path & Extension',
          score: Math.max(25, Math.min(98, 88 - (scores.casting + scores['rolling-over']) * 2.5 + scores.healthyHit))
        },
        {
          label: 'Timing & Weight Transfer',
          score: Math.max(25, Math.min(98, 85 - scores.lunging * 4.2 + scores.healthyHit))
        },
        {
          label: 'Glove Presentation & Funnel',
          score: Math.max(25, Math.min(98, 88 - scores['glove-stab'] * 4 + scores.healthyField * 1.2))
        },
        {
          label: 'Footwork, Routes & Throwing',
          score: Math.max(25, Math.min(98, 87 - (scores['footwork-cadence'] + scores['banana-route'] + scores['crow-hop']) * 2.2 + scores.healthyField))
        }
      ].map((m) => ({
        ...m,
        score: Math.round(m.score),
        status: m.score >= 76 ? 'Solid Base' : m.score >= 56 ? 'Tune-Up Needed' : 'Priority Fix'
      }));

      const hitClinic = CLINIC_BY_ID[topHitId];
      const fieldClinic = CLINIC_BY_ID[topFieldId];
      const recBatId = hitClinic ? hitClinic.batId : 'goods-2026';
      const recBat = BAT_RECOMMENDATIONS[recBatId];

      return {
        createdAt: new Date().toISOString(),
        scores,
        topHitId,
        secHitId,
        topFieldId,
        secFieldId,
        hitHealthy: scores[topHitId] <= 4 && scores.healthyHit >= 12,
        fieldHealthy: scores[topFieldId] <= 4 && scores.healthyField >= 12,
        pillarMetrics,
        recBatId,
        recBat,
        hitClinic,
        fieldClinic
      };
    }

    function renderDiagnosticReport(report) {
      if (!reportWrapEl) return;
      reportWrapEl.hidden = false;
      reportWrapEl.classList.remove('is-revealed');
      void reportWrapEl.offsetWidth;
      reportWrapEl.classList.add('is-revealed');

      const hitClinic = report.hitClinic;
      const fieldClinic = report.fieldClinic;
      const secHitClinic = CLINIC_BY_ID[report.secHitId];
      const secFieldClinic = CLINIC_BY_ID[report.secFieldId];

      reportWrapEl.innerHTML = `
        <div class="rgb-led-rail rgb-led-rail--studio" aria-hidden="true"></div>
        <div class="report-head">
          <div>
            <div class="kicker-line">20-Question Player Scouting Report</div>
            <h2>Your Custom Hitting &amp; Fielding Plan</h2>
            <p class="section-subtitle">Pinpointed from your 20 mechanics responses with custom drills, video breakdowns, and bat setup.</p>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:0.55rem;">
            <button type="button" id="save-report-playbook-btn" class="btn btn-primary btn-sm">Save Plan to My Playbook</button>
            <a class="btn btn-secondary btn-sm" href="index.html?bat=${encodeURIComponent(report.recBatId)}#gameday-studio">Test ${report.recBat.name.split(' ')[0]} in 3D Cage</a>
            <a class="btn btn-ghost btn-sm" href="scenarios.html">Scenario Quizzes</a>
          </div>
        </div>

        <div class="report-pillars-grid">
          ${report.pillarMetrics
            .map(
              (m) => `
            <div class="pillar-card">
              <div class="pillar-top">
                <span class="pillar-name">${m.label}</span>
                <span class="pillar-val tabular-nums">${m.score}% · ${m.status}</span>
              </div>
              <div class="pillar-track"><div class="pillar-fill" style="width:${m.score}%;"></div></div>
            </div>`
            )
            .join('')}
        </div>

        <div class="report-cards-grid">
          <article class="card">
            <div class="meta-line">Hitting Priority · ${report.hitHealthy ? 'Maintenance' : 'Primary Flaw'}</div>
            <h3>${report.hitHealthy ? `Clean Base — Tune ${hitClinic.title}` : hitClinic.flawName}</h3>
            <p style="color:var(--text-secondary);">${hitClinic.summary}</p>
            <p style="font-weight:600;color:var(--accent);">Pro Fix Cue: "${hitClinic.fixCue}"</p>
            <div class="report-drill-box">
              <strong>Top Recommended Drill:</strong> ${hitClinic.drills[0].name} (${hitClinic.drills[0].reps})<br>
              <span style="color:var(--text-secondary);">${hitClinic.drills[0].setup}</span>
            </div>
            <div style="margin-top:0.85rem;display:flex;flex-wrap:wrap;gap:0.55rem;align-items:center;">
              <button type="button" class="btn btn-primary btn-sm" data-watch-clinic="${hitClinic.id}">Watch Fix Video</button>
              ${secHitClinic ? `<button type="button" class="btn btn-secondary btn-sm" data-watch-clinic="${secHitClinic.id}">Watch Secondary: ${secHitClinic.title}</button>` : ''}
            </div>
          </article>

          <article class="card">
            <div class="meta-line">Fielding Priority · ${report.fieldHealthy ? 'Maintenance' : 'Primary Flaw'}</div>
            <h3>${report.fieldHealthy ? `Sharp Hands — Tune ${fieldClinic.title}` : fieldClinic.flawName}</h3>
            <p style="color:var(--text-secondary);">${fieldClinic.summary}</p>
            <p style="font-weight:600;color:var(--accent);">Pro Fix Cue: "${fieldClinic.fixCue}"</p>
            <div class="report-drill-box">
              <strong>Top Recommended Drill:</strong> ${fieldClinic.drills[0].name} (${fieldClinic.drills[0].reps})<br>
              <span style="color:var(--text-secondary);">${fieldClinic.drills[0].setup}</span>
            </div>
            <div style="margin-top:0.85rem;display:flex;flex-wrap:wrap;gap:0.55rem;align-items:center;">
              <button type="button" class="btn btn-primary btn-sm" data-watch-clinic="${fieldClinic.id}">Watch Fix Video</button>
              ${secFieldClinic ? `<button type="button" class="btn btn-secondary btn-sm" data-watch-clinic="${secFieldClinic.id}">Watch Secondary: ${secFieldClinic.title}</button>` : ''}
            </div>
          </article>
        </div>

        <div class="report-bottom-grid">
          <div class="card-subtle">
            <div class="meta-line">Recommended Cage Bat</div>
            <h4 style="margin-bottom:0.35rem;">${report.recBat.name}</h4>
            <p style="margin-bottom:0.65rem;color:var(--text-secondary);font-size:0.92rem;">${report.recBat.reason}</p>
            <a class="btn btn-secondary btn-sm" href="index.html?bat=${encodeURIComponent(report.recBatId)}#gameday-studio">Swing in RHB / LHB Cage</a>
          </div>
          <div class="card-subtle">
            <div class="meta-line">2-Week Practice Schedule</div>
            <h4 style="margin-bottom:0.35rem;">3 Sessions / Week · 20 Minutes</h4>
            <p style="margin-bottom:0;color:var(--text-secondary);font-size:0.92rem;">
              Start with <strong>${hitClinic.drills[0].name}</strong> (${hitClinic.drills[0].reps}), move to 15 dry/wall reps of <strong>${hitClinic.drills[1].name}</strong>, and finish field work with <strong>${fieldClinic.drills[0].name}</strong>.
            </p>
          </div>
          <div class="card-subtle">
            <div class="meta-line">Recommended Play Lesson</div>
            <h4 style="margin-bottom:0.35rem;">Film &amp; Rule Study</h4>
            <p style="margin-bottom:0.65rem;color:var(--text-secondary);font-size:0.92rem;">Connect these drills to live diamond situations &amp; rule trivia.</p>
            <a class="btn btn-secondary btn-sm" href="detail.html?id=${encodeURIComponent(hitClinic.scenarioId)}">Open Linked Scenario</a>
          </div>
        </div>
      `;

      reportWrapEl.querySelectorAll('[data-watch-clinic]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const cid = btn.dataset.watchClinic;
          selectClinic(cid, true);
          slowMo = true;
          if (speedBtn) {
            speedBtn.setAttribute('aria-pressed', 'true');
            speedBtn.textContent = 'Speed: 0.45x Slow-Mo';
          }
          const videoSection = document.getElementById('video-clinic-section');
          if (videoSection) videoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });

      const savePlanBtn = document.getElementById('save-report-playbook-btn');
      if (savePlanBtn) {
        let savingPlan = false;
        savePlanBtn.addEventListener('click', async () => {
          if (savingPlan) return;
          savingPlan = true;
          savePlanBtn.disabled = true;
          savePlanBtn.classList.add('is-loading');
          savePlanBtn.textContent = 'Saving Plan...';
          const title = `Scouting Plan: ${hitClinic.title} + ${fieldClinic.title}`;
          const body = [
            `HITTING PRIORITY: ${hitClinic.flawName}`,
            `Cue: ${hitClinic.fixCue}`,
            `Drill: ${hitClinic.drills[0].name} (${hitClinic.drills[0].reps})`,
            ``,
            `FIELDING PRIORITY: ${fieldClinic.flawName}`,
            `Cue: ${fieldClinic.fixCue}`,
            `Drill: ${fieldClinic.drills[0].name} (${fieldClinic.drills[0].reps})`,
            ``,
            `RECOMMENDED CAGE BAT: ${report.recBat.name}`
          ].join('\n');
          try {
            const res = await fetch('/api/playbook', {
              method: 'POST',
              credentials: 'same-origin',
              headers: authHeaders({ 'Content-Type': 'application/json' }),
              body: JSON.stringify({ title, body, rating: 5 })
            });
            if (res.status === 401) {
              savePlanBtn.textContent = 'Log in to save plan...';
              setTimeout(() => {
                window.location.href = 'login.html?next=training.html';
              }, 850);
              return;
            }
            if (!res.ok) throw new Error('Save failed');
            savePlanBtn.textContent = 'Saved to My Playbook!';
          } catch {
            savePlanBtn.textContent = 'Save failed — try logging in';
            savePlanBtn.disabled = false;
          } finally {
            savingPlan = false;
            savePlanBtn.classList.remove('is-loading');
          }
        });
      }
    }

    if (quizListEl) {
      quizListEl.addEventListener('change', (e) => {
        const input = e.target;
        if (!input || input.type !== 'radio') return;
        const qid = Number(input.name.replace('diag-q-', ''));
        answers[qid] = input.value;
        const card = input.closest('.quiz-q-card');
        if (card) {
          card.classList.add('is-answered');
          card.classList.remove('is-missing');
          const meta = card.querySelector('.quiz-q-meta');
          if (meta && !meta.textContent.includes('Answered')) {
            meta.textContent = `${meta.textContent} · Answered`;
          }
          card.querySelectorAll('.quiz-opt-label').forEach((lbl) => lbl.classList.remove('is-selected'));
          const parentLbl = input.closest('.quiz-opt-label');
          if (parentLbl) parentLbl.classList.add('is-selected');
        }
        if (quizErrorEl) {
          quizErrorEl.className = 'feedback-banner';
          quizErrorEl.textContent = '';
        }
        updateProgressUi();
      });
    }

    if (quizPartTabs) {
      quizPartTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-qpart]');
        if (!btn) return;
        partFilter = btn.dataset.qpart;
        quizPartTabs.querySelectorAll('[data-qpart]').forEach((b) => {
          b.setAttribute('aria-pressed', String(b.dataset.qpart === partFilter));
        });
        renderQuizQuestions();
      });
    }

    if (quizSubmitBtn) {
      quizSubmitBtn.addEventListener('click', () => {
        const missing = QUIZ_QUESTIONS.filter((q) => !answers[q.id]).map((q) => `Q${q.id}`);
        if (missing.length > 0) {
          if (quizErrorEl) {
            quizErrorEl.className = 'feedback-banner is-error';
            quizErrorEl.textContent = `Answer all 20 questions first (${missing.length} left: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '...' : ''}).`;
          }
          if (partFilter !== 'all') {
            partFilter = 'all';
            quizPartTabs?.querySelectorAll('[data-qpart]').forEach((b) => {
              b.setAttribute('aria-pressed', String(b.dataset.qpart === 'all'));
            });
            renderQuizQuestions();
          }
          quizListEl?.querySelectorAll('.quiz-q-card').forEach((c) => {
            const cid = Number(c.dataset.qid);
            c.classList.toggle('is-missing', !answers[cid]);
          });
          const firstMissingCard = quizListEl?.querySelector(`[data-qid="${missing[0].slice(1)}"]`);
          firstMissingCard?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        if (quizErrorEl) {
          quizErrorEl.className = 'feedback-banner';
          quizErrorEl.textContent = '';
        }
        const report = computeDiagnosticReport();
        try {
          localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify({ answers, report }));
        } catch {
          /* ignore */
        }
        renderDiagnosticReport(report);
        reportWrapEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    if (quizSampleBtn) {
      quizSampleBtn.addEventListener('click', () => {
        // Fill realistic player flaw sample (Bat Drag + Glove Stab) so players can preview instantly
        const sample = ['b', 'b', 'a', 'a', 'c', 'c', 'b', 'c', 'a', 'c', 'c', 'b', 'b', 'c', 'a', 'c', 'c', 'b', 'd', 'c'];
        QUIZ_QUESTIONS.forEach((q, idx) => {
          answers[q.id] = sample[idx] || 'a';
        });
        if (quizErrorEl) {
          quizErrorEl.className = 'feedback-banner';
          quizErrorEl.textContent = '';
        }
        renderQuizQuestions();
        const report = computeDiagnosticReport();
        renderDiagnosticReport(report);
        reportWrapEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    if (quizClearBtn) {
      quizClearBtn.addEventListener('click', () => {
        for (const k of Object.keys(answers)) delete answers[k];
        try {
          localStorage.removeItem(QUIZ_STORAGE_KEY);
        } catch {
          /* ignore */
        }
        if (reportWrapEl) reportWrapEl.hidden = true;
        if (quizErrorEl) {
          quizErrorEl.className = 'feedback-banner';
          quizErrorEl.textContent = '';
        }
        renderQuizQuestions();
      });
    }

    // Restore saved quiz report if user previously ran it
    try {
      const savedRaw = localStorage.getItem(QUIZ_STORAGE_KEY);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (parsed && parsed.answers) {
          for (const [k, v] of Object.entries(parsed.answers)) {
            answers[Number(k)] = v;
          }
          if (parsed.report && Object.keys(answers).length === QUIZ_QUESTIONS.length) {
            renderDiagnosticReport(parsed.report);
          }
        }
      }
    } catch {
      /* ignore */
    }

    renderQuizQuestions();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTrainingPage();
  });
})();
