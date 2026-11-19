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
      batId: 'combat-blue',
      batNote: 'Try the Combat Spec-A1 Members Club Blue (-3) for fast balanced hand speed inside the ball.',
      scenarioId: 'two-strike-approach',
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
      fixCue: 'Stay Palm-Up (bottom hand) / Palm-Down (top hand) all the way past contact.',
      summary: 'Snapping the top wrist over before or right at contact slams the barrel downward, turning hard pitches into weak pull-side grounders.',
      stages: ['1. Balanced Load', '2. On-Plane Entry', '3. Palm-Up Contact', '4. Full Zone Extension'],
      batId: 'goods-2026',
      batNote: 'Test with 2026 The Goods (-3): hold top-hand palm skyward and launch balls 25°–30° into LF/LCF.',
      scenarioId: 'launch-angle-exit-velo',
      drills: [
        {
          name: 'Palm-Up / Palm-Down Freeze Drill',
          setup: 'Hit off a waist-high tee and stop the bat 8 inches past the tee stem.',
          reps: '4 sets × 8 swings',
          cue: 'Freeze and check your hands: top palm faces the ground, bottom palm faces the sky—no wrist roll!'
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
      batId: 'combat-rodeo',
      batNote: 'Pair with Combat Spec-A1 Rodeo (-3) against Mix/Changeup pitches in the 3D cage.',
      scenarioId: 'pitch-tunneling',
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
      batId: 'goods-2022',
      batNote: 'Strong throwing rhythm pairs with strong lower-half ground force.',
      scenarioId: 'double-play-pivot',
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
      batId: 'combat-blue',
      batNote: 'Outfield speed + barrel control keeps line drives from finding the gap.',
      scenarioId: 'cutoff-relay',
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
      batId: 'goods-2026',
      batNote: 'Transferring ground momentum through the core builds both throwing velo and exit velo.',
      scenarioId: 'cutoff-relay',
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
        { key: 'b', text: 'Top palm stays facing down / bottom palm faces up extending through', weights: { healthyHit: 3 } },
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

    function drawSegment(x1, y1, x2, y2, w, color) {
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
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
        'baum-gold': { handle: '#18110b', cuff: '#111827', barrel: '#eab364', accent: '#fde68a', cap: '#291a0e', knob: '#110c07' },
        'goods-2026': { handle: '#0f172a', cuff: '#ef4444', barrel: '#1b2230', accent: '#2dd4bf', cap: '#090d14', knob: '#ef4444' },
        'goods-2022': { handle: '#18181b', cuff: '#dc2626', barrel: '#e2e8f0', accent: '#dc2626', cap: '#0f172a', knob: '#dc2626' },
        'combat-rodeo': { handle: '#854d0e', cuff: '#ea580c', barrel: '#f3ead8', accent: '#7f1d1d', cap: '#7f1d1d', knob: '#7f1d1d' },
        'combat-blue': { handle: '#1e3a8a', cuff: '#facc15', barrel: '#72c8f8', accent: '#172554', cap: '#172554', knob: '#1e3a8a' }
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
      // Connector / Taper Cuff
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
      // Barrel Stripe & End Cap
      ctx.fillStyle = t.accent;
      ctx.fillRect(36, -3.9, 4.5, 7.8);
      ctx.fillStyle = t.cap;
      ctx.fillRect(57, -3.6, 3.2, 7.2);
      // Specular sheen highlight
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(36, -1.9);
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

      // Phase easing curves
      const load = Math.min(1, p / 0.30);
      const stride = p < 0.25 ? 0 : Math.min(1, (p - 0.25) / 0.22);
      const swing = p < 0.45 ? 0 : Math.min(1, (p - 0.45) / 0.26);
      const finish = p < 0.71 ? 0 : Math.min(1, (p - 0.71) / 0.29);

      // Compute biomechanics offsets by clinic + flaw vs pro
      let hipShiftX = -load * 6 + stride * 12;
      let headDrop = 0;
      let frontKneeBend = 10;
      let rearElbowLead = 0;
      let handCastX = 0;
      let wristRoll = 0;
      let barrelLagDeg = -1.95; // ready behind shoulder

      if (clinicId === 'lunging') {
        if (isFlaw) {
          hipShiftX += stride * 34 + swing * 12;
          headDrop = stride * 18;
          frontKneeBend = 2; // locked front leg!
        } else {
          hipShiftX = -load * 7 + stride * 11;
          frontKneeBend = 8 - swing * 6; // blocks cleanly
        }
      } else if (clinicId === 'bat-drag') {
        if (isFlaw) {
          rearElbowLead = swing * 28; // elbow shoots way ahead!
          barrelLagDeg = -1.95 + swing * 1.15; // barrel lags behind
        } else {
          rearElbowLead = swing * 6;
          barrelLagDeg = -1.95 + swing * 2.15; // tight snap through zone
        }
      } else if (clinicId === 'casting') {
        if (isFlaw) {
          handCastX = swing * 32; // pushes hands way out toward pitcher!
          barrelLagDeg = -1.85 + swing * 2.05;
        } else {
          handCastX = swing * 6;
          barrelLagDeg = -1.95 + swing * 2.22;
        }
      } else if (clinicId === 'rolling-over') {
        if (isFlaw) {
          wristRoll = swing * 1.45; // top wrist turns over steeply downward!
          barrelLagDeg = -1.9 + swing * 2.4 + finish * 0.4;
        } else {
          barrelLagDeg = -1.9 + swing * 2.05 + finish * 0.15;
        }
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

      // Draw Legs
      drawSegment(backFootX, groundY - 4, backKneeX, backKneeY, 8, c.body);
      drawSegment(backKneeX, backKneeY, hipX - 6, hipY, 9, c.body);
      drawSegment(frontFootX, groundY - 4, frontKneeX, frontKneeY, 8, c.body);
      drawSegment(frontKneeX, frontKneeY, hipX + 6, hipY, 9, c.body);

      // Torso & Head
      const shX = hipX - 4 + (clinicId === 'lunging' && isFlaw ? stride * 18 : -swing * 5);
      const shY = hipY - 46 + headDrop * 0.45;
      drawSegment(hipX, hipY, shX, shY, 13, jersey);

      // Head & Batting Helmet
      const headX = shX + 3 + (clinicId === 'lunging' && isFlaw ? stride * 8 : 0);
      const headY = shY - 17;
      drawJoint(headX, headY, 10, '#fed7aa', null);
      ctx.beginPath();
      ctx.arc(headX - 1, headY - 2, 11, Math.PI * 0.9, Math.PI * 2.05);
      ctx.fillStyle = jersey;
      ctx.fill();
      ctx.fillRect(headX + 4, headY - 4, 11, 3); // visor facing pitcher

      // Fence visual for Casting Wall Drill!
      if (clinicId === 'casting') {
        ctx.strokeStyle = 'rgba(248, 250, 252, 0.35)';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(cx - 46, groundY - 140);
        ctx.lineTo(cx - 46, groundY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Arms, Rear Elbow & Hands
      const backShoulderX = shX - 6;
      const backShoulderY = shY + 5;
      const frontShoulderX = shX + 7;
      const frontShoulderY = shY + 5;

      const handsX = shX + 12 + handCastX + swing * 22 - load * 8;
      const handsY = shY + 11 + swing * 12 + wristRoll * 8;

      const rearElbowX = backShoulderX - 4 + rearElbowLead + swing * 12;
      const rearElbowY = backShoulderY + 18 + (clinicId === 'bat-drag' && !isFlaw ? 6 : 0);

      drawSegment(backShoulderX, backShoulderY, rearElbowX, rearElbowY, 6, jersey);
      drawSegment(rearElbowX, rearElbowY, handsX, handsY, 5.5, '#fed7aa');
      drawSegment(frontShoulderX, frontShoulderY, (frontShoulderX + handsX) * 0.5, (frontShoulderY + handsY) * 0.5 + 3, 5.5, jersey);
      drawSegment((frontShoulderX + handsX) * 0.5, (frontShoulderY + handsY) * 0.5 + 3, handsX, handsY, 5, '#fed7aa');

      // Highlight Joint Warning or Cue Circle
      if (clinicId === 'bat-drag') {
        drawJoint(rearElbowX, rearElbowY, 6, accent, '#ffffff');
      } else if (clinicId === 'casting' || clinicId === 'rolling-over') {
        drawJoint(handsX, handsY, 6, accent, '#ffffff');
      } else if (clinicId === 'lunging') {
        drawJoint(frontKneeX, frontKneeY, 6, accent, '#ffffff');
      }

      // 3D-Styled Actual Theme Bat (Baum Bat Gold / 2026 Goods / 2022 Goods / Combat Rodeo / Combat Blue)
      const batAngle = barrelLagDeg + finish * 0.65 + (clinicId === 'rolling-over' && isFlaw ? wristRoll * 0.5 : 0);
      drawThemedBat2D(handsX, handsY, batAngle, c.activeBatId || 'goods-2026');

      // Incoming & Batted Ball Trajectory
      const contactP = 0.60;
      const ballContactX = cx + 44;
      const ballContactY = groundY - 56;
      if (p <= contactP) {
        const t = p / contactP;
        const bx = x + w - 24 + (ballContactX - (x + w - 24)) * t;
        const by = ballContactY - 8 + Math.sin(t * Math.PI) * 6;
        drawBaseball(bx, by, 6);
      } else {
        const t = (p - contactP) / (1 - contactP);
        // Pro swings send crisp elevated backspin line drive; Flaw swings send weak grounders or pop-ups!
        const endBx = x + w - 18;
        let endBy = ballContactY - 78;
        if (isFlaw) {
          endBy = clinicId === 'rolling-over' ? groundY - 6 : clinicId === 'lunging' ? groundY - 4 : ballContactY - 105;
        }
        const bx = ballContactX + (endBx - ballContactX) * t;
        const by = ballContactY + (endBy - ballContactY) * t - (isFlaw && clinicId === 'casting' ? Math.sin(t * Math.PI) * 35 : 0);

        // Flight path preview trace
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

      // Draw Fielder Body + Legs + Glove
      const hipY = groundY - 56 + crouch * 0.65 - hopY;
      const shY = hipY - 40 + crouch * 0.3;
      const shX = fx + crouch * 0.25;
      drawSegment(fx - 16, groundY - 4 - hopY, fx - 6, groundY - 28 - hopY, 8, c.body);
      drawSegment(fx - 6, groundY - 28 - hopY, fx, hipY, 8.5, c.body);
      drawSegment(fx + 14, groundY - 4 - hopY, fx + 10, groundY - 28 - hopY, 8, c.body);
      drawSegment(fx + 10, groundY - 28 - hopY, fx, hipY, 8.5, c.body);
      drawSegment(fx, hipY, shX, shY, 13, jersey);

      // Head + Cap
      drawJoint(shX + 3, shY - 16, 9.5, '#fed7aa', null);
      ctx.beginPath();
      ctx.arc(shX + 2, shY - 18, 10.5, Math.PI * 0.9, Math.PI * 2.05);
      ctx.fillStyle = jersey;
      ctx.fill();
      ctx.fillRect(shX + 6, shY - 20, 10, 3);

      // Glove & Throwing Arm
      const gx = shX + gloveOut;
      const gy = clinicId === 'crow-hop' ? shY + 6 : groundY - 16 - (clinicId === 'glove-stab' && !isFlaw ? 2 : 0) - hopY;
      drawSegment(shX + 4, shY + 5, gx, gy, 5.5, jersey);
      drawJoint(gx, gy, 7.5, '#92400e', accent);
      if (clinicId === 'crow-hop') {
        const tx = shX - 6 + Math.cos(armAngle) * 26;
        const ty = shY + 4 + Math.sin(armAngle) * 26;
        drawSegment(shX - 4, shY + 5, tx, ty, 5, '#fed7aa');
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
    const batSelectEl = document.getElementById('clinic-bat-select');

    let activeClinic = VIDEO_CLINICS[0];
    let activeBatId = 'goods-2026';
    let domainFilter = 'all';
    let viewMode = 'split'; // 'split' | 'pro' | 'flaw'
    let playing = true;
    let slowMo = false;
    let progress = 0;
    let lastTs = 0;
    const renderer = videoCanvas ? createVideoRenderer(videoCanvas) : null;

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
        if (renderer) renderer.render(activeClinic, progress, viewMode, activeBatId);
      });
    }

    if (saveDrillBtn) {
      saveDrillBtn.addEventListener('click', async () => {
        const title = `Drill Fix: ${activeClinic.title}`;
        const body = `${activeClinic.fixCue}\nDrills:\n- ${activeClinic.drills.map((d) => `${d.name} (${d.reps}): ${d.cue}`).join('\n- ')}`;
        try {
          const res = await fetch('/api/playbook', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, body, rating: 4 })
          });
          if (res.status === 401) {
            saveDrillBtn.textContent = 'Log in to save to Playbook';
            setTimeout(() => {
              window.location.href = 'login.html';
            }, 900);
            return;
          }
          if (!res.ok) throw new Error('Could not save');
          saveDrillBtn.textContent = 'Saved to My Playbook!';
          setTimeout(() => {
            saveDrillBtn.textContent = 'Save Drill to My Playbook';
          }, 2200);
        } catch {
          saveDrillBtn.textContent = 'Could not save right now';
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
      if (quizProgressText) quizProgressText.textContent = `${count} / ${QUIZ_QUESTIONS.length} answered`;
      if (quizProgressBar) quizProgressBar.style.width = `${Math.round((count / QUIZ_QUESTIONS.length) * 100)}%`;
    }

    function renderQuizQuestions() {
      if (!quizListEl) return;
      const visible = QUIZ_QUESTIONS.filter((q) => partFilter === 'all' || q.part === partFilter);
      quizListEl.innerHTML = visible
        .map((q) => {
          const picked = answers[q.id];
          return `
            <fieldset class="quiz-q-card" data-qid="${q.id}">
              <legend class="quiz-q-title">
                <span class="quiz-q-num tabular-nums">Q${String(q.id).padStart(2, '0')}</span>
                <span>${q.prompt}</span>
              </legend>
              <div class="quiz-q-meta">${q.partLabel}</div>
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
            <a class="btn btn-secondary btn-sm" href="index.html#gameday-studio">Test Bat in 3D Cage</a>
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
            <p style="margin-bottom:0;color:var(--text-secondary);font-size:0.92rem;">${report.recBat.reason}</p>
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
            <p style="margin-bottom:0.65rem;color:var(--text-secondary);font-size:0.92rem;">Connect these drills to live diamond situations.</p>
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
        savePlanBtn.addEventListener('click', async () => {
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
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title, body, rating: 5 })
            });
            if (res.status === 401) {
              savePlanBtn.textContent = 'Log in to save plan...';
              setTimeout(() => {
                window.location.href = 'login.html';
              }, 900);
              return;
            }
            if (!res.ok) throw new Error('Save failed');
            savePlanBtn.textContent = 'Saved to My Playbook!';
          } catch {
            savePlanBtn.textContent = 'Save failed — try logging in';
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
          card.querySelectorAll('.quiz-opt-label').forEach((lbl) => lbl.classList.remove('is-selected'));
          const parentLbl = input.closest('.quiz-opt-label');
          if (parentLbl) parentLbl.classList.add('is-selected');
        }
        if (quizErrorEl) quizErrorEl.textContent = '';
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
