/* DiamondIQ — Short YouTube Drill Library + 28-Question Player Baseline Profile */
(function () {
  'use strict';

  const QUIZ_STORAGE_KEY = 'diamondiq_baseline_quiz_v2';

  const BAT_RECOMMENDATIONS = {
    'baum-gold': {
      name: 'Baum Bat Gold (-3 PermaWood)',
      reason: 'Gives immediate, honest wood sweet-spot feedback for building clean barrel connection.'
    },
    'goods-2026': {
      name: '2026 DeMarini The Goods (-3 Hybrid)',
      reason: 'Slightly end-loaded alloy barrel rewards smooth hip-to-hand turns and high backspin.'
    },
    'goods-2022': {
      name: '2022 DeMarini The Goods (-3 Chrome)',
      reason: 'Forgiving sweet spot with strong barrel presence for gap-to-gap hitters.'
    },
    'combat-rodeo': {
      name: 'Combat Spec-A1 Rodeo (-3 1-Piece Alloy)',
      reason: 'Crisp one-piece alloy feedback that helps you feel timing and pitch adjustability.'
    },
    'combat-blue': {
      name: 'Combat Spec-A1 Members Club Blue (-3)',
      reason: 'Fast, balanced swing weight ideal for catching up to velocity and staying inside the ball.'
    }
  };

  /* 8 Short, Practical Drill Guides Backed by Verified Real YouTube Videos */
  const DRILL_GUIDES = [
    {
      id: 'bat-drag',
      domain: 'hitting',
      domainLabel: 'Hitting · Hips & Hands',
      title: 'Keep Your Hands Connected',
      duration: '10–12 min tee & dry work',
      batId: 'baum-gold',
      scenarioId: 'launch-angle-exit-velo',
      summary:
        'Great for hitters who feel jammed or late on faster pitches. Focusing on turning the barrel cleanly with your hands—instead of letting your back elbow get ahead—unlocks effortless quickness.',
      cues: [
        'Start relaxed with your back elbow soft—never pinched hard against your ribs.',
        'Fire your belt buckle toward the pitcher first while your hands stay back by your shoulder.',
        'Lead with the knob inside the ball so the barrel follows naturally into the zone.'
      ],
      youtubeVideos: [
        {
          title: 'How To Fix "Roll Over" & "Dumping The Barrel" (Bat Drag Fix)',
          channel: 'YouGoProBaseball',
          url: 'https://www.youtube.com/watch?v=bkXB66PSKvw',
          why: 'Clear, step-by-step coach breakdown on keeping the hands connected through launch.'
        },
        {
          title: 'ADD BAT SPEED FAST!! (Increase Bat Speed)',
          channel: 'Ultimate Baseball Training',
          url: 'https://www.youtube.com/watch?v=TTf94BRSuq0',
          why: 'Simple bat-speed drills you can run on a tee in under 10 minutes.'
        }
      ],
      drills: [
        {
          name: 'Split-Grip Tee Drill',
          reps: '2 sets × 8 swings',
          setup: 'Slide your top hand 2 inches up the handle above your bottom hand on a waist-high middle tee.',
          cue: 'Punch the top hand through toward middle-away so both arms work together.'
        },
        {
          name: 'Connection Ball / Towel Tuck',
          reps: '2 sets × 8 dry + tee',
          setup: 'Hold a folded towel gently between your back arm and torso during load, letting it drop only after contact.',
          cue: 'Turn smoothly around your spine rather than shoving the elbow forward.'
        }
      ]
    },
    {
      id: 'casting',
      domain: 'hitting',
      domainLabel: 'Hitting · Short Path',
      title: 'Stay Short & Inside the Ball',
      duration: '10 min backyard tee',
      batId: 'combat-blue',
      scenarioId: 'launch-angle-exit-velo',
      summary:
        'Helps hitters whose hands swing wide away from their body around the zone. Keeping the barrel tight to your shoulder makes inner-half fastballs easy to drive fair.',
      cues: [
        'Keep your hands close to your back shoulder at heel plant.',
        'Picture driving the inside seam of the baseball toward the opposite-field gap.',
        'Finish high without wrapping your hands wide past the plate.'
      ],
      youtubeVideos: [
        {
          title: 'Hitting Drills To Improve Your Bat Path',
          channel: 'Antonelli Baseball',
          url: 'https://www.youtube.com/watch?v=oh9rdbm6ne8',
          why: 'Pro-style breakdown showing exactly how to keep the barrel tight and direct.'
        },
        {
          title: 'Try This Simple Drill To Fix Your Bat Path',
          channel: 'Antonelli Baseball',
          url: 'https://www.youtube.com/watch?v=-Gz0rkrP1Fk',
          why: 'Fast visual tee cue any player can set up at home with a ball bucket or net.'
        }
      ],
      drills: [
        {
          name: 'Fence / Net Constraint Swings',
          reps: '3 sets × 6 swings',
          setup: 'Stand one bat-length from a fence or net, holding the bat normally without striking the net as you turn.',
          cue: 'Turn tightly inside the barrel length.'
        },
        {
          name: 'Inside-Half Deep Tee',
          reps: '2 sets × 10 balls',
          setup: 'Place the tee at belly-button height on the inner edge and drive balls back up the middle.',
          cue: 'Beat the pitch deep—no wide sweep needed.'
        }
      ]
    },
    {
      id: 'rolling-over',
      domain: 'hitting',
      domainLabel: 'Hitting · Extension',
      title: 'Drive Line Drives (Stop Rolling Over)',
      duration: '10–15 min tee / front toss',
      batId: 'goods-2026',
      scenarioId: 'xwoba-metrics',
      summary:
        'Built for hitters who pull too many hard grounders to shortstop or third base. Holding your top-hand posture slightly longer through contact turns grounders into backspin gap liners.',
      cues: [
        'At contact, keep your top hand palm facing the sky and bottom hand palm facing the dirt.',
        'Think about extending through two baseballs in a row toward center field.',
        'Let your hips finish naturally instead of snapping your wrists early.'
      ],
      youtubeVideos: [
        {
          title: "Here's Why You're \"Rolling Over\" - (FIX IT FAST!)",
          channel: 'Ultimate Baseball Training',
          url: 'https://www.youtube.com/watch?v=0Qa-GRJ7CE0',
          why: 'Explains why early wrist roll happens and shows an instant palm-up fix.'
        },
        {
          title: 'Staying Inside the Baseball (Stop Rolling Everything Over)',
          channel: 'Developing Prospects',
          url: 'https://www.youtube.com/watch?v=rycVUepelwA',
          why: 'Practical front-toss & tee progression to drive liners into the gaps.'
        },
        {
          title: 'Creating the Proper Baseball Bat Path',
          channel: 'Antonelli Baseball',
          url: 'https://www.youtube.com/watch?v=imer1h_iYf4',
          why: 'Great companion watch for matching pitch plane on line drives.'
        }
      ],
      drills: [
        {
          name: 'One-Hand Top-Hand Extension',
          reps: '2 sets × 8 swings',
          setup: 'Use a light bat or choke up with only your top hand on middle-away balls off a tee.',
          cue: 'Push palm-up cleanly toward center field.'
        },
        {
          name: 'Two-Ball Tee Drive',
          reps: '2 sets × 8 reps',
          setup: 'Hit middle-out tee reps aiming for the back top corner of the net.',
          cue: 'Hold barrel extension long past the plate.'
        }
      ]
    },
    {
      id: 'lunging',
      domain: 'hitting',
      domainLabel: 'Hitting · Timing & Balance',
      title: 'Stay Balanced on Off-Speed & Timing',
      duration: '12 min cage / toss',
      batId: 'combat-rodeo',
      scenarioId: 'xwoba-metrics',
      summary:
        'Ideal when changeups or breaking balls make you lunge onto your front foot. Learning to stride soft and keep your head quiet buys extra time to recognize spin.',
      cues: [
        'Keep your weight centered inside your back hip during the stride.',
        'Land softly on the ball of your front foot before deciding to swing.',
        'Keep your eyes level—your chin shouldn’t drop forward toward the pitcher.'
      ],
      youtubeVideos: [
        {
          title: 'Keeping Your Load with the Stride - Baseball Hitting Drills',
          channel: 'DNA Sports',
          url: 'https://www.youtube.com/watch?v=FQus_SP0DKQ',
          why: 'Demonstrates how to land softly on balance so off-speed pitches stay hittable.'
        },
        {
          title: 'Hitting Drills To Improve Your Bat Path',
          channel: 'Antonelli Baseball',
          url: 'https://www.youtube.com/watch?v=oh9rdbm6ne8',
          why: 'Connects balanced timing directly to a clean swing plane.'
        }
      ],
      drills: [
        {
          name: 'Stride-Freeze-Hit',
          reps: '2 sets × 8 swings',
          setup: 'Take your normal stride on a tee or soft toss, pause for 1 full beat balanced, then swing.',
          cue: 'Head stays tall right between both feet.'
        },
        {
          name: 'No-Stride Timing Rounds',
          reps: '2 sets × 10 pitches',
          setup: 'Start wide in your landing stance and hit mixed fastball/changeup front toss.',
          cue: 'Let the ball travel deep to your front hip.'
        }
      ]
    },
    {
      id: 'glove-stab',
      domain: 'infield',
      domainLabel: 'Infield · Soft Hands',
      title: 'Soft Hands & Infield Funnel',
      duration: '8–10 min daily routine',
      batId: 'goods-2022',
      scenarioId: 'force-vs-tag',
      summary:
        'A quick daily glove-work routine every beginner and varsity infielder uses. Receiving the ball out in front with relaxed fingers turns tough hops into easy outs.',
      cues: [
        'Get low early and show your glove pocket to the ball out in front of your eyes.',
        'Use soft fingers—catch it out front and funnel gently toward your belly button.',
        'Keep your throwing hand close as a “cover” so transfers take one smooth motion.'
      ],
      youtubeVideos: [
        {
          title: "Antonelli Baseball's Infield Hands Routine",
          channel: 'Antonelli Baseball',
          url: 'https://www.youtube.com/watch?v=WoSNZqN5G9E',
          why: 'Gold-standard 5-minute everyday hands routine with a partner or wall.'
        },
        {
          title: 'MLB INFIELD DRILLS ("Hands Routine")',
          channel: 'YouGoProBaseball',
          url: 'https://www.youtube.com/watch?v=SHA1orN7eHE',
          why: 'Breaks down short hops, backhands, and forehands clearly step-by-step.'
        }
      ],
      drills: [
        {
          name: '3-Angle Kneeling Barehand & Glove',
          reps: '15 reps each angle',
          setup: 'On one knee, receive short-hops straight ahead, forehand, and backhand from 12 feet.',
          cue: 'Play the hop cleanly—catch it before it plays you.'
        },
        {
          name: 'Triangle Out-Front Funnel',
          reps: '2 sets × 10 reps',
          setup: 'Field slow rollers out front, pulling both hands smoothly into your midsection.',
          cue: 'Soft fingers, quick center transfer.'
        }
      ]
    },
    {
      id: 'footwork-cadence',
      domain: 'infield',
      domainLabel: 'Infield · Rhythm & Throws',
      title: 'Infield Footwork & Smooth Exchanges',
      duration: '10–12 min field/yard',
      batId: 'combat-blue',
      scenarioId: 'stealing-second',
      summary:
        'Replaces flat-footed fielding with easy athletic rhythm. Moving through the baseball lets your legs power the throw across the diamond with way less arm strain.',
      cues: [
        'Use a light prep step right before contact so your ankles are ready to move.',
        'Work slightly around the ball from right-to-left so your momentum faces first base.',
        'Use “Right — Left — Catch — Right — Throw” as a smooth, quiet rhythm.'
      ],
      youtubeVideos: [
        {
          title: 'Infield Footwork Drills',
          channel: 'Antonelli Baseball',
          url: 'https://www.youtube.com/watch?v=0_Z3vLKtVl4',
          why: 'Shows exact footwork angles and rhythm for every routine ground ball.'
        },
        {
          title: 'Footwork Drills for Elite Infield Play',
          channel: 'Antonelli Baseball',
          url: 'https://www.youtube.com/watch?v=5YUw_Wk46zg',
          why: 'Great drills for syncing glove funnel and throwing footwork.'
        }
      ],
      drills: [
        {
          name: 'Right-Left-Catch Cone Rhythm',
          reps: '2 sets × 8 reps',
          setup: 'Walk cleanly around a cone on a stationary ball, timing your catch as your left foot lands.',
          cue: 'Keep your chest moving toward your target.'
        },
        {
          name: '4-Seam Quick Exchange',
          reps: '20 quick reps',
          setup: 'Catch and separate cleanly to a 4-seam grip in front of your chest without throwing.',
          cue: 'Quick feet create accurate throws.'
        }
      ]
    },
    {
      id: 'banana-route',
      domain: 'outfield',
      domainLabel: 'Outfield · First Step & Angles',
      title: '45° Outfield Drop Step & Direct Routes',
      duration: '10 min grass field',
      batId: 'combat-rodeo',
      scenarioId: 'tagging-up',
      summary:
        'Helps outfielders stop drifting or curving under deep fly balls. Opening the hips at 45 degrees and running straight to the spot adds instant range.',
      cues: [
        'Read the bat angle off the swing before taking your first step.',
        'On balls over your shoulder, snap your hips open 45° and sprint—don’t backpedal.',
        'Pump your arms smoothly without holding your glove out too early.'
      ],
      youtubeVideos: [
        {
          title: 'Outfield Tips - The Drop and Hop Step',
          channel: 'Antonelli Baseball',
          url: 'https://www.youtube.com/watch?v=tH9-7NyhtTg',
          why: 'Clear visual demonstration of proper drop-step footwork and hip opening.'
        }
      ],
      drills: [
        {
          name: '45° Drop-Step Hip Snaps',
          reps: '8 left + 8 right',
          setup: 'On a point cue, open one hip 45° back and sprint 12 yards straight to the catch point.',
          cue: 'Open, run, then track with quiet eyes.'
        },
        {
          name: 'Over-the-Shoulder Track',
          reps: '2 sets × 6 reps',
          setup: 'Run diagonally away from a partner tossing fly balls into your blind spot.',
          cue: 'Trust your angle first, reach last.'
        }
      ]
    },
    {
      id: 'crow-hop',
      domain: 'outfield',
      domainLabel: 'Outfield · Throwing Carry',
      title: 'Clean Crow Hop & Relay Throws',
      duration: '10 min long-toss / field',
      batId: 'goods-2026',
      scenarioId: 'relay-throw',
      summary:
        'Instead of jumping straight up and losing steam, a low, forward crow hop keeps your body moving toward the cutoff man for strong, accurate throws.',
      cues: [
        'Catch the fly ball moving forward on your glove-side foot whenever possible.',
        'Keep your crow hop low and downhill—skip toward the target, not up toward the sky.',
        'Aim through the cutoff man’s head/chest on one clean hop if needed.'
      ],
      youtubeVideos: [
        {
          title: 'Outfield Crow Hop vs. Step Behind Technique!',
          channel: 'Ultimate Baseball Training',
          url: 'https://www.youtube.com/watch?v=vMU7ds_WpiM',
          why: 'Compares both pro outfield footwork styles so you can pick what feels best.'
        },
        {
          title: 'How to Crow Hop in Baseball - Speed & Accuracy',
          channel: 'ProSwingNY',
          url: 'https://www.youtube.com/watch?v=JuS6DimRH4s',
          why: 'Quick coaching guide on transferring smoothly without wasting steps.'
        }
      ],
      drills: [
        {
          name: 'Line-Skip Crow Hop',
          reps: '2 sets × 8 throws',
          setup: 'Catch a gentle toss 5 steps behind a chalk line and skim low across the line into a throw.',
          cue: 'Gain ground forward cleanly, eyes on cutoff.'
        },
        {
          name: 'One-Hop Cutoff Target',
          reps: '10 crisp throws',
          setup: 'Throw firm line drives from mid-outfield aiming to bounce cleanly once to a bucket/partner.',
          cue: 'Low trajectory beats high rainbows every time.'
        }
      ]
    }
  ];

  const CLINIC_BY_ID = Object.fromEntries(DRILL_GUIDES.map((c) => [c.id, c]));

  /* =========================================================
     28-Question Non-Judgmental Player Baseline Quiz
     ("Understand You & Build Your Baseline" — ZERO right/wrong answers!)
     ========================================================= */
  const BASELINE_QUESTIONS = [
    // PART 1: You & Your Background (Q01–Q05)
    {
      id: 1,
      part: 'background',
      partLabel: 'Part 1 · Background & Level',
      prompt: 'What level of baseball are you currently playing or preparing for?',
      options: [
        { key: 'a', text: 'Brand new / Rec league — learning the ropes', tags: { level: 'beginner', focus: 'bat-drag', defFocus: 'glove-stab' } },
        { key: 'b', text: 'Youth / 10U–13U travel ball — building consistency', tags: { level: 'youth', focus: 'casting', defFocus: 'footwork-cadence' } },
        { key: 'c', text: 'High school / 14U–18U competitive ball', tags: { level: 'hs', focus: 'rolling-over', defFocus: 'footwork-cadence' } },
        { key: 'd', text: 'College / Mens league / serious backyard & cage training', tags: { level: 'advanced', focus: 'rolling-over', defFocus: 'crow-hop' } }
      ]
    },
    {
      id: 2,
      part: 'background',
      partLabel: 'Part 1 · Background & Level',
      prompt: 'Which defensive spots feel most natural to you right now?',
      options: [
        { key: 'a', text: 'Middle infield (SS / 2B) — quick hands and feet', tags: { pos: 'infield', defFocus: 'footwork-cadence' } },
        { key: 'b', text: 'Corner infield / Catcher (3B / 1B / C) — reactions & arm', tags: { pos: 'corner', defFocus: 'glove-stab' } },
        { key: 'c', text: 'Outfield (LF / CF / RF) — tracking flies and throwing', tags: { pos: 'outfield', defFocus: 'banana-route' } },
        { key: 'd', text: 'Utility / Pitcher / Still figuring out my favorite spot', tags: { pos: 'utility', defFocus: 'glove-stab' } }
      ]
    },
    {
      id: 3,
      part: 'background',
      partLabel: 'Part 1 · Background & Level',
      prompt: 'How do you bat and throw?',
      options: [
        { key: 'a', text: 'Bat Right / Throw Right', tags: { hand: 'R/R' } },
        { key: 'b', text: 'Bat Left / Throw Right or Left', tags: { hand: 'L' } },
        { key: 'c', text: 'Switch hitter / Bat Both', tags: { hand: 'Switch' } },
        { key: 'd', text: 'Bat Right / Throw Left', tags: { hand: 'R/L' } }
      ]
    },
    {
      id: 4,
      part: 'background',
      partLabel: 'Part 1 · Background & Level',
      prompt: 'How long have you been playing organized baseball or hitting regularly?',
      options: [
        { key: 'a', text: 'Less than 1 year — still getting comfortable', tags: { expTier: 1 } },
        { key: 'b', text: '1 to 3 seasons', tags: { expTier: 2 } },
        { key: 'c', text: '4 to 6 seasons', tags: { expTier: 3 } },
        { key: 'd', text: '7+ seasons', tags: { expTier: 4 } }
      ]
    },
    {
      id: 5,
      part: 'background',
      partLabel: 'Part 1 · Background & Level',
      prompt: 'Realistically, how many days a week can you practice outside of games?',
      options: [
        { key: 'a', text: '1 day a week (weekend or team practice)', tags: { freq: '1 day / week · 15-min focused session' } },
        { key: 'b', text: '2 to 3 days a week (short home or cage sessions)', tags: { freq: '2–3 days / week · 20-min routine' } },
        { key: 'c', text: '4+ days a week (consistent daily work)', tags: { freq: '4–5 days / week · structured blocks' } },
        { key: 'd', text: 'Mostly seasonal / whenever I can get to a cage', tags: { freq: 'Flexible 15-min checkup blocks' } }
      ]
    },

    // PART 2: At-Bat Tendencies & Feel (Q06–Q12)
    {
      id: 6,
      part: 'hitting',
      partLabel: 'Part 2 · At the Plate',
      prompt: 'When you square one up cleanly, what kind of hit do you usually produce?',
      options: [
        { key: 'a', text: 'Hard ground balls through the infield gaps', tags: { hitStyle: 'contact', focus: 'rolling-over' } },
        { key: 'b', text: 'Low line drives up the middle or opposite field', tags: { hitStyle: 'liner', focus: 'casting' } },
        { key: 'c', text: 'Deep fly balls and gap extra-base hits', tags: { hitStyle: 'power', focus: 'bat-drag' } },
        { key: 'd', text: 'A mix — still trying to find consistent solid contact', tags: { hitStyle: 'building', focus: 'bat-drag' } }
      ]
    },
    {
      id: 7,
      part: 'hitting',
      partLabel: 'Part 2 · At the Plate',
      prompt: 'On pitches you miss or don’t catch quite cleanly, where does the ball mostly go?',
      options: [
        { key: 'a', text: 'Rolled-over grounders toward the pull side (3B/SS for RHB)', tags: { focus: 'rolling-over', hitNeed: 'extension' } },
        { key: 'b', text: 'Late foul balls or jammed handles toward the opposite side', tags: { focus: 'bat-drag', hitNeed: 'quickness' } },
        { key: 'c', text: 'Pop-ups straight up or weak flares off the end cap', tags: { focus: 'casting', hitNeed: 'path' } },
        { key: 'd', text: 'Swings and misses out in front on slower pitches', tags: { focus: 'lunging', hitNeed: 'timing' } }
      ]
    },
    {
      id: 8,
      part: 'hitting',
      partLabel: 'Part 2 · At the Plate',
      prompt: 'Which pitch location feels most comfortable for you to hit hard right now?',
      options: [
        { key: 'a', text: 'Belt-high pitches down the middle', tags: { comfort: 'middle' } },
        { key: 'b', text: 'Inner half — I like turning on fastballs', tags: { comfort: 'inside', focus: 'casting' } },
        { key: 'c', text: 'Outer half — I like letting the ball travel', tags: { comfort: 'outside', focus: 'rolling-over' } },
        { key: 'd', text: 'Honestly, just trying to put strikes in play consistently', tags: { comfort: 'any', focus: 'bat-drag' } }
      ]
    },
    {
      id: 9,
      part: 'hitting',
      partLabel: 'Part 2 · At the Plate',
      prompt: 'How do you feel when facing a pitcher throwing noticeably faster than your average game?',
      options: [
        { key: 'a', text: 'Comfortable — I start my load earlier and simplify my stride', tags: { veloScore: 4 } },
        { key: 'b', text: 'Okay once I see 2–3 pitches, a little rushed on the first one', tags: { veloScore: 3, focus: 'bat-drag' } },
        { key: 'c', text: 'Usually behind it and swinging defensively', tags: { veloScore: 2, focus: 'bat-drag' } },
        { key: 'd', text: 'Haven’t seen much higher velocity yet — want a baseline plan', tags: { veloScore: 2, focus: 'casting' } }
      ]
    },
    {
      id: 10,
      part: 'hitting',
      partLabel: 'Part 2 · At the Plate',
      prompt: 'How do off-speed pitches (changeups, curveballs) affect your timing?',
      options: [
        { key: 'a', text: 'I recognize spin early and adjust smoothly', tags: { offspeedScore: 4 } },
        { key: 'b', text: 'I can lay off balls in the dirt, though I’m sometimes out front', tags: { offspeedScore: 3, focus: 'lunging' } },
        { key: 'c', text: 'My weight gets onto my front foot early and I reach for them', tags: { offspeedScore: 2, focus: 'lunging' } },
        { key: 'd', text: 'Mostly facing straight fastballs / pitching machine right now', tags: { offspeedScore: 2 } }
      ]
    },
    {
      id: 11,
      part: 'hitting',
      partLabel: 'Part 2 · At the Plate',
      prompt: 'What happens to your mentality when you get to a two-strike count?',
      options: [
        { key: 'a', text: 'Widen slightly, shorten stride, and battle middle-away', tags: { twoStrike: 4 } },
        { key: 'b', text: 'Try to protect the plate, sometimes rushing at borderline pitches', tags: { twoStrike: 3 } },
        { key: 'c', text: 'Keep the exact same big swing I took on 0-0', tags: { twoStrike: 2 } },
        { key: 'd', text: 'Tense up slightly because I really don’t want to strike out', tags: { twoStrike: 2 } }
      ]
    },
    {
      id: 12,
      part: 'hitting',
      partLabel: 'Part 2 · At the Plate',
      prompt: 'What does your pre-pitch load and stride feel like?',
      options: [
        { key: 'a', text: 'Calm, rhythmic coil and soft front-foot landing', tags: { loadScore: 4 } },
        { key: 'b', text: 'Medium leg kick — sometimes rushed if I’m amped up', tags: { loadScore: 3, focus: 'lunging' } },
        { key: 'c', text: 'No-stride / small toe-tap to keep things simple', tags: { loadScore: 3 } },
        { key: 'd', text: 'Not really sure yet — nobody has walked me through a routine', tags: { loadScore: 2, focus: 'casting' } }
      ]
    },

    // PART 3: Defense, Footwork & Arm Profile (Q13–Q18)
    {
      id: 13,
      part: 'fielding',
      partLabel: 'Part 3 · Defense & Arm',
      prompt: 'When a hard ground ball is hit directly at you, what feels natural?',
      options: [
        { key: 'a', text: 'Move around it smoothly and field out front with two hands', tags: { defScore: 4 } },
        { key: 'b', text: 'Stop it reliably, though my feet get a little flat waiting', tags: { defScore: 3, defFocus: 'footwork-cadence' } },
        { key: 'c', text: 'Sometimes stab down late or take hard hops off my chest/palm', tags: { defScore: 2, defFocus: 'glove-stab' } },
        { key: 'd', text: 'I spend more time in the outfield or mound than taking grounders', tags: { defScore: 3, defFocus: 'crow-hop' } }
      ]
    },
    {
      id: 14,
      part: 'fielding',
      partLabel: 'Part 3 · Defense & Arm',
      prompt: 'How comfortable do you feel judging fly balls in the outfield?',
      options: [
        { key: 'a', text: 'Good jump — I read trajectory off the bat right away', tags: { ofScore: 4 } },
        { key: 'b', text: 'Solid on balls in front, trickier on balls hit directly over my head', tags: { ofScore: 3, defFocus: 'banana-route' } },
        { key: 'c', text: 'Tend to drift slightly sideways before locking onto the landing spot', tags: { ofScore: 2, defFocus: 'banana-route' } },
        { key: 'd', text: 'Rarely play outfield — want simple first-step fundamentals', tags: { ofScore: 2, defFocus: 'banana-route' } }
      ]
    },
    {
      id: 15,
      part: 'fielding',
      partLabel: 'Part 3 · Defense & Arm',
      prompt: 'How do your longer throws across the infield or from the outfield feel?',
      options: [
        { key: 'a', text: 'Strong, online carry with good accuracy to the chest', tags: { armScore: 4 } },
        { key: 'b', text: 'Accurate, though they lose steam near the end of long throws', tags: { armScore: 3, defFocus: 'crow-hop' } },
        { key: 'c', text: 'Tend to sail high or pull wide when trying to throw hard', tags: { armScore: 2, defFocus: 'crow-hop' } },
        { key: 'd', text: 'Still building everyday arm strength and proper 4-seam grip', tags: { armScore: 2, defFocus: 'footwork-cadence' } }
      ]
    },
    {
      id: 16,
      part: 'fielding',
      partLabel: 'Part 3 · Defense & Arm',
      prompt: 'Do you have a consistent pre-pitch routine before the pitcher delivers?',
      options: [
        { key: 'a', text: 'Yes — quiet creep step and glove ready every single pitch', tags: { prepScore: 4 } },
        { key: 'b', text: 'Usually, though I forget in slower innings', tags: { prepScore: 3, defFocus: 'footwork-cadence' } },
        { key: 'c', text: 'I stand in athletic ready position without a timed hop', tags: { prepScore: 3, defFocus: 'glove-stab' } },
        { key: 'd', text: 'Haven’t built a pre-pitch rhythm yet', tags: { prepScore: 2, defFocus: 'footwork-cadence' } }
      ]
    },
    {
      id: 17,
      part: 'fielding',
      partLabel: 'Part 3 · Defense & Arm',
      prompt: 'How do backhand or forehand plays to your side feel right now?',
      options: [
        { key: 'a', text: 'Confident taking either angle on the run', tags: { rangeScore: 4 } },
        { key: 'b', text: 'Forehand feels great; backhand plays feel awkward', tags: { rangeScore: 3, defFocus: 'glove-stab' } },
        { key: 'c', text: 'Work hard to get in front, tough when forced off my line', tags: { rangeScore: 2, defFocus: 'footwork-cadence' } },
        { key: 'd', text: 'Just working on catching routine plays cleanly first', tags: { rangeScore: 2, defFocus: 'glove-stab' } }
      ]
    },
    {
      id: 18,
      part: 'fielding',
      partLabel: 'Part 3 · Defense & Arm',
      prompt: 'When a teammate makes an extra-base hit throw or relay, how clear are you on your job?',
      options: [
        { key: 'a', text: 'Always know whether to line up as cutoff, cover a bag, or back up', tags: { iqScore: 4 } },
        { key: 'b', text: 'Know my main position well, sometimes pause on backup spots', tags: { iqScore: 3 } },
        { key: 'c', text: 'Sometimes wait for coaches or teammates to yell where to throw', tags: { iqScore: 2 } },
        { key: 'd', text: 'Learning relay & situational rules right now', tags: { iqScore: 2 } }
      ]
    },

    // PART 4: Equipment, Body & Training Setup (Q19–Q23)
    {
      id: 19,
      part: 'gear',
      partLabel: 'Part 4 · Gear & Practice Setup',
      prompt: 'What bat weight/feel do you swing best with?',
      options: [
        { key: 'a', text: 'Light & balanced — lets me whip the barrel fast (Combat Blue feel)', tags: { batId: 'combat-blue' } },
        { key: 'b', text: '1-piece crisp alloy feedback (Combat Spec-A1 Rodeo feel)', tags: { batId: 'combat-rodeo' } },
        { key: 'c', text: '2-piece hybrid with slight end-load pop (The Goods feel)', tags: { batId: 'goods-2026' } },
        { key: 'd', text: 'Wood / composite wood feel for pure barrel feedback (Baum Bat Gold)', tags: { batId: 'baum-gold' } }
      ]
    },
    {
      id: 20,
      part: 'gear',
      partLabel: 'Part 4 · Gear & Practice Setup',
      prompt: 'How does your current bat feel on long cage days or 3+ at-bat games?',
      options: [
        { key: 'a', text: 'Effortless — I stay quick even in the 6th/7th inning', tags: { fatigue: 4 } },
        { key: 'b', text: 'Feels good early, slightly heavy late against fast arms', tags: { fatigue: 3, batId: 'combat-blue' } },
        { key: 'c', text: 'Feels light enough that I sometimes feel rushed out front', tags: { fatigue: 3, batId: 'goods-2026' } },
        { key: 'd', text: 'I use whatever team bat is in the dugout', tags: { fatigue: 3 } }
      ]
    },
    {
      id: 21,
      part: 'gear',
      partLabel: 'Part 4 · Gear & Practice Setup',
      prompt: 'What training gear do you actually have access to during the week?',
      options: [
        { key: 'a', text: 'Solo setup: batting tee, net, and bucket of balls', tags: { gearSetup: 'Solo Tee & Net' } },
        { key: 'b', text: 'Partner / parent / coach for front toss and grounders', tags: { gearSetup: 'Partner Front-Toss & Field' } },
        { key: 'c', text: 'Indoor cage / pitching machine access', tags: { gearSetup: 'Batting Cage & Machine' } },
        { key: 'd', text: 'Limited gear — mostly open field, wall ball, and dry swings', tags: { gearSetup: 'Dry Swings, Wall Ball & Field' } }
      ]
    },
    {
      id: 22,
      part: 'gear',
      partLabel: 'Part 4 · Gear & Practice Setup',
      prompt: 'How does your arm recover after throwing sessions or games?',
      options: [
        { key: 'a', text: 'Fresh — I warm up with bands / long toss and recover fine', tags: { armCare: 4 } },
        { key: 'b', text: 'A little tight the next morning unless I stretch well', tags: { armCare: 3 } },
        { key: 'c', text: 'Don’t really have an arm-care routine before or after games', tags: { armCare: 2 } },
        { key: 'd', text: 'Mostly focused on hitting and running right now', tags: { armCare: 3 } }
      ]
    },
    {
      id: 23,
      part: 'gear',
      partLabel: 'Part 4 · Gear & Practice Setup',
      prompt: 'How do you feel about your sprint speed and first-step explosiveness?',
      options: [
        { key: 'a', text: 'Quick first step — running bases and chasing gaps is a strength', tags: { speedScore: 4 } },
        { key: 'b', text: 'Average game speed — solid once up to speed', tags: { speedScore: 3 } },
        { key: 'c', text: 'First two steps feel a bit heavy; want sharper agility', tags: { speedScore: 2 } },
        { key: 'd', text: 'Haven’t focused much on speed/agility work yet', tags: { speedScore: 2 } }
      ]
    },

    // PART 5: Mindset, Learning & Season Goals (Q24–Q28)
    {
      id: 24,
      part: 'mindset',
      partLabel: 'Part 5 · Goals & Mindset',
      prompt: 'What is your #1 goal for the next 30 days on the diamond?',
      options: [
        { key: 'a', text: 'Make harder, cleaner contact more often (more line drives)', tags: { goal: 'Harder line-drive barrels' } },
        { key: 'b', text: 'Catch up to faster pitching and cut down strikeouts', tags: { goal: 'Faster timing & plate confidence' } },
        { key: 'c', text: 'Clean up defense — soft hands, cleaner throws, smarter routes', tags: { goal: 'Clean defense & accurate throws' } },
        { key: 'd', text: 'Feel confident everywhere — learn rules, plays, and fundamentals', tags: { goal: 'Complete everyday baseball confidence' } }
      ]
    },
    {
      id: 25,
      part: 'mindset',
      partLabel: 'Part 5 · Goals & Mindset',
      prompt: 'How do you usually react right after a tough strikeout or fielding error?',
      options: [
        { key: 'a', text: 'Shake it off after one breath and lock in on the next pitch', tags: { mindsetScore: 4 } },
        { key: 'b', text: 'Rehash it for an inning before settling back down', tags: { mindsetScore: 3 } },
        { key: 'c', text: 'Start overthinking my swing or hands mid-game', tags: { mindsetScore: 2 } },
        { key: 'd', text: 'Get frustrated and tighten up on the next play', tags: { mindsetScore: 2 } }
      ]
    },
    {
      id: 26,
      part: 'mindset',
      partLabel: 'Part 5 · Goals & Mindset',
      prompt: 'When stepping into the batter’s box, what works best for your focus?',
      options: [
        { key: 'a', text: 'One simple external thought: “hit a line drive back up the middle”', tags: { approachScore: 4 } },
        { key: 'b', text: 'Looking for a fastball in a specific zone until 2 strikes', tags: { approachScore: 4 } },
        { key: 'c', text: 'Usually thinking about 2–3 swing mechanics at once', tags: { approachScore: 2 } },
        { key: 'd', text: 'Just trying to see the ball and react as best I can', tags: { approachScore: 3 } }
      ]
    },
    {
      id: 27,
      part: 'mindset',
      partLabel: 'Part 5 · Goals & Mindset',
      prompt: 'How do you learn baseball skills fastest?',
      options: [
        { key: 'a', text: 'Watching a real coach demonstrate a short drill on YouTube', tags: { learnStyle: 'Real Coach YouTube Clips' } },
        { key: 'b', text: 'Jumping straight into reps on a tee or in the 3D Simulator', tags: { learnStyle: 'Hands-On Reps & 3D Cage' } },
        { key: 'c', text: 'Short 3-step checklists saved on my phone before practice', tags: { learnStyle: 'Short 3-Cue Checklists' } },
        { key: 'd', text: 'Talking through specific game situations with a coach (Coach Jax)', tags: { learnStyle: '1-on-1 Coaching Q&A' } }
      ]
    },
    {
      id: 28,
      part: 'mindset',
      partLabel: 'Part 5 · Goals & Mindset',
      prompt: 'When you finish a practice session, what makes you feel like it was a win?',
      options: [
        { key: 'a', text: 'Hearing clean barrel contact & feeling relaxed in the box', tags: { winMetric: 'Clean sweet-spot feel' } },
        { key: 'b', text: 'Knowing what specific drill moved the needle in 15 minutes', tags: { winMetric: 'Focused 15-min improvement' } },
        { key: 'c', text: 'Making tough defensive plays feel routine and smooth', tags: { winMetric: 'Routine defensive consistency' } },
        { key: 'd', text: 'Having more fun and confidence going into the next game', tags: { winMetric: 'Game-day fun & poise' } }
      ]
    }
  ];

  /* =========================================================
     Training Lab Page Controller
     ========================================================= */
  async function initTrainingPage() {
    const root = document.getElementById('training-lab');
    if (!root) return;

    const clinicListEl = document.getElementById('clinic-video-list');
    const domainFilterEl = document.getElementById('clinic-domain-filter');
    const titleEl = document.getElementById('clinic-active-title');
    const metaEl = document.getElementById('clinic-active-meta');
    const durationEl = document.getElementById('clinic-duration-badge');
    const summaryEl = document.getElementById('clinic-active-summary');
    const ytWrapEl = document.getElementById('clinic-youtube-wrap');
    const howToStepsEl = document.getElementById('clinic-howto-steps');
    const drillsWrapEl = document.getElementById('clinic-drills-wrap');
    const saveDrillBtn = document.getElementById('save-clinic-drill-btn');
    const playLinkEl = document.getElementById('clinic-play-link');
    const cageLinkEl = document.getElementById('clinic-cage-link');

    let activeClinic = DRILL_GUIDES[0];
    let domainFilter = 'all';

    function renderClinicButtons() {
      if (!clinicListEl) return;
      const items = DRILL_GUIDES.filter((c) => domainFilter === 'all' || c.domain === domainFilter);
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

    function selectClinic(id) {
      const found = CLINIC_BY_ID[id];
      if (!found) return;
      activeClinic = found;

      if (metaEl) metaEl.textContent = found.domainLabel;
      if (titleEl) titleEl.textContent = found.title;
      if (durationEl) durationEl.textContent = found.duration;
      if (summaryEl) summaryEl.textContent = found.summary;
      if (playLinkEl) playLinkEl.href = `detail.html?id=${encodeURIComponent(found.scenarioId)}`;
      if (cageLinkEl) cageLinkEl.href = `index.html?bat=${encodeURIComponent(found.batId)}#gameday-studio`;

      if (ytWrapEl) {
        ytWrapEl.innerHTML = found.youtubeVideos
          .map(
            (v) => `
            <article class="yt-video-card">
              <div class="yt-video-channel">${v.channel} · YouTube</div>
              <h4 class="yt-video-title">${v.title}</h4>
              <p class="yt-video-why">${v.why}</p>
              <a class="btn btn-primary btn-sm" href="${v.url}" target="_blank" rel="noopener noreferrer">Watch on YouTube &nearr;</a>
            </article>`
          )
          .join('');
      }

      if (howToStepsEl) {
        howToStepsEl.innerHTML = found.cues.map((cue) => `<li>${cue}</li>`).join('');
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
        selectClinic(btn.dataset.clinicId);
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
        const title = `Drill Guide: ${activeClinic.title}`;
        const body = [
          activeClinic.summary,
          '',
          '3 Quick Cues:',
          ...activeClinic.cues.map((c, i) => `${i + 1}. ${c}`),
          '',
          'Drills:',
          ...activeClinic.drills.map((d) => `- ${d.name} (${d.reps}): ${d.cue}`),
          '',
          'YouTube Reference:',
          ...activeClinic.youtubeVideos.map((v) => `- ${v.title} (${v.channel}): ${v.url}`)
        ].join('\n');
        try {
          const res = await fetch('/api/playbook', {
            method: 'POST',
            credentials: 'same-origin',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ title, body, rating: 5 })
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

    const qp = new URLSearchParams(window.location.search);
    const initialClinicId = qp.get('clinic');
    const targetClinic = initialClinicId && CLINIC_BY_ID[initialClinicId] ? initialClinicId : DRILL_GUIDES[0].id;
    selectClinic(targetClinic);

    /* =========================================================
       2. 28-Question Non-Judgmental Player Baseline Profile
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
      const pct = Math.round((count / BASELINE_QUESTIONS.length) * 100);
      if (quizProgressText) {
        quizProgressText.textContent = `${count} / ${BASELINE_QUESTIONS.length} answered (${pct}%)`;
      }
      if (quizProgressBar) quizProgressBar.style.width = `${pct}%`;
    }

    function renderQuizQuestions() {
      if (!quizListEl) return;
      const visible = BASELINE_QUESTIONS.filter((q) => partFilter === 'all' || q.part === partFilter);
      quizListEl.innerHTML = visible
        .map((q) => {
          const picked = answers[q.id];
          return `
            <fieldset class="quiz-q-card${picked ? ' is-answered' : ''}" data-qid="${q.id}">
              <legend class="quiz-q-title">
                <span class="quiz-q-num tabular-nums">Q${String(q.id).padStart(2, '0')}</span>
                <span>${q.prompt}</span>
              </legend>
              <div class="quiz-q-meta">${q.partLabel}${picked ? ' · Noted' : ''}</div>
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

    function computeBaselineReport() {
      const focusCounts = {
        'bat-drag': 0,
        casting: 0,
        'rolling-over': 0,
        lunging: 0
      };
      const defCounts = {
        'glove-stab': 0,
        'footwork-cadence': 0,
        'banana-route': 0,
        'crow-hop': 0
      };

      let level = 'youth';
      let pos = 'infield';
      let hand = 'R/R';
      let expTier = 2;
      let freq = '2–3 days / week · 20-min routine';
      let gearSetup = 'Solo Tee & Net';
      let goal = 'Harder line-drive barrels';
      let learnStyle = 'Real Coach YouTube Clips';
      let winMetric = 'Clean sweet-spot feel';
      let recBatId = 'goods-2026';

      const scores = {
        velo: 3,
        offspeed: 3,
        twoStrike: 3,
        load: 3,
        def: 3,
        of: 3,
        arm: 3,
        prep: 3,
        range: 3,
        iq: 3,
        fatigue: 3,
        armCare: 3,
        speed: 3,
        mindset: 3,
        approach: 3
      };

      for (const q of BASELINE_QUESTIONS) {
        const pickedKey = answers[q.id];
        const opt = q.options.find((o) => o.key === pickedKey);
        if (!opt || !opt.tags) continue;
        const t = opt.tags;
        if (t.level) level = t.level;
        if (t.pos) pos = t.pos;
        if (t.hand) hand = t.hand;
        if (t.expTier) expTier = t.expTier;
        if (t.freq) freq = t.freq;
        if (t.gearSetup) gearSetup = t.gearSetup;
        if (t.goal) goal = t.goal;
        if (t.learnStyle) learnStyle = t.learnStyle;
        if (t.winMetric) winMetric = t.winMetric;
        if (t.batId && q.id === 19) recBatId = t.batId;
        if (t.batId && q.id === 20 && recBatId === 'goods-2026') recBatId = t.batId;
        if (t.focus && focusCounts[t.focus] !== undefined) focusCounts[t.focus] += 1;
        if (t.defFocus && defCounts[t.defFocus] !== undefined) defCounts[t.defFocus] += 1;
        if (t.veloScore) scores.velo = t.veloScore;
        if (t.offspeedScore) scores.offspeed = t.offspeedScore;
        if (t.twoStrike) scores.twoStrike = t.twoStrike;
        if (t.loadScore) scores.load = t.loadScore;
        if (t.defScore) scores.def = t.defScore;
        if (t.ofScore) scores.of = t.ofScore;
        if (t.armScore) scores.arm = t.armScore;
        if (t.prepScore) scores.prep = t.prepScore;
        if (t.rangeScore) scores.range = t.rangeScore;
        if (t.iqScore) scores.iq = t.iqScore;
        if (t.fatigue) scores.fatigue = t.fatigue;
        if (t.armCare) scores.armCare = t.armCare;
        if (t.speedScore) scores.speed = t.speedScore;
        if (t.mindsetScore) scores.mindset = t.mindsetScore;
        if (t.approachScore) scores.approach = t.approachScore;
      }

      const sortedHit = Object.keys(focusCounts).sort((a, b) => focusCounts[b] - focusCounts[a]);
      const sortedDef = Object.keys(defCounts).sort((a, b) => defCounts[b] - defCounts[a]);
      const topHitId = sortedHit[0];
      const topFieldId = sortedDef[0];

      const levelLabels = {
        beginner: 'Starter / Rec Foundation',
        youth: 'Developing Travel Baller',
        hs: 'Competitive High School Builder',
        advanced: 'Varsity / College Grinder'
      };
      const posLabels = {
        infield: 'Middle Infield',
        corner: 'Corner / Catcher',
        outfield: 'Outfield',
        utility: 'All-Around Utility'
      };

      const pctFromAvg = (vals) => Math.round(Math.min(96, Math.max(42, (vals.reduce((a, b) => a + b, 0) / (vals.length * 4)) * 100)));
      const labelStatus = (p) => (p >= 78 ? 'Comfortable Base' : p >= 60 ? 'Steady Progress' : 'Great Growth Area');

      const pillarMetrics = [
        { label: 'Plate Timing & Velo', score: pctFromAvg([scores.velo, scores.offspeed, scores.load]) },
        { label: 'Two-Strike Approach', score: pctFromAvg([scores.twoStrike, scores.approach]) },
        { label: 'Glove & Defensive Prep', score: pctFromAvg([scores.def, scores.of, scores.prep, scores.range]) },
        { label: 'Throwing & Arm Care', score: pctFromAvg([scores.arm, scores.armCare, scores.fatigue]) },
        { label: 'Game Mindset & IQ', score: pctFromAvg([scores.mindset, scores.iq, Math.min(4, expTier)]) }
      ].map((m) => ({ ...m, status: labelStatus(m.score) }));

      const hitGuide = CLINIC_BY_ID[topHitId] || DRILL_GUIDES[0];
      const fieldGuide = CLINIC_BY_ID[topFieldId] || DRILL_GUIDES[4];
      const recBat = BAT_RECOMMENDATIONS[recBatId] || BAT_RECOMMENDATIONS['goods-2026'];

      return {
        createdAt: new Date().toISOString(),
        archetypeTitle: `${levelLabels[level] || 'Developing Player'} · ${posLabels[pos] || 'Utility'} (${hand})`,
        summary: `We built your baseline around ${freq.toLowerCase()} with ${gearSetup.toLowerCase()}, prioritizing "${goal.toLowerCase()}" via ${learnStyle.toLowerCase()}.`,
        freq,
        gearSetup,
        goal,
        learnStyle,
        winMetric,
        pillarMetrics,
        topHitId,
        topFieldId,
        recBatId,
        recBat,
        hitGuide,
        fieldGuide
      };
    }

    function renderDiagnosticReport(report) {
      if (!reportWrapEl) return;
      reportWrapEl.hidden = false;
      reportWrapEl.classList.remove('is-revealed');
      void reportWrapEl.offsetWidth;
      reportWrapEl.classList.add('is-revealed');

      const hitGuide = report.hitGuide;
      const fieldGuide = report.fieldGuide;

      reportWrapEl.innerHTML = `
        <div class="rgb-led-rail rgb-led-rail--studio" aria-hidden="true"></div>
        <div class="report-head">
          <div>
            <div class="kicker-line">28-Question Player Baseline Profile</div>
            <h2>${report.archetypeTitle}</h2>
            <p class="section-subtitle">${report.summary}</p>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:0.55rem;">
            <button type="button" id="save-report-playbook-btn" class="btn btn-primary btn-sm">Save Baseline to My Playbook</button>
            <a class="btn btn-secondary btn-sm" href="index.html?bat=${encodeURIComponent(report.recBatId)}#gameday-studio">Try ${report.recBat.name.split(' ')[0]} in 3D Stadium</a>
            <button type="button" class="btn btn-ghost btn-sm" data-open-jax data-jax-prompt="Here is my 28-Q baseline: ${report.archetypeTitle}. Main goal: ${report.goal}. Weekly setup: ${report.gearSetup} (${report.freq}). Give me a simple Day 1 practice plan.">Ask Coach Jax About My Baseline</button>
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
            <div class="meta-line">Baseline Plate Focus · ${hitGuide.duration}</div>
            <h3>${hitGuide.title}</h3>
            <p style="color:var(--text-secondary);">${hitGuide.summary}</p>
            <div class="report-drill-box">
              <strong>Day-1 Drill (${report.gearSetup}):</strong> ${hitGuide.drills[0].name} (${hitGuide.drills[0].reps})<br>
              <span style="color:var(--text-secondary);">${hitGuide.drills[0].cue}</span>
            </div>
            <div style="margin-top:0.85rem;display:flex;flex-wrap:wrap;gap:0.55rem;align-items:center;">
              <a class="btn btn-primary btn-sm" href="${hitGuide.youtubeVideos[0].url}" target="_blank" rel="noopener noreferrer">Watch on YouTube (${hitGuide.youtubeVideos[0].channel}) &nearr;</a>
              <button type="button" class="btn btn-secondary btn-sm" data-open-guide="${hitGuide.id}">Load in Drill Hub</button>
            </div>
          </article>

          <article class="card">
            <div class="meta-line">Baseline Defense Focus · ${fieldGuide.duration}</div>
            <h3>${fieldGuide.title}</h3>
            <p style="color:var(--text-secondary);">${fieldGuide.summary}</p>
            <div class="report-drill-box">
              <strong>Day-1 Field Drill:</strong> ${fieldGuide.drills[0].name} (${fieldGuide.drills[0].reps})<br>
              <span style="color:var(--text-secondary);">${fieldGuide.drills[0].cue}</span>
            </div>
            <div style="margin-top:0.85rem;display:flex;flex-wrap:wrap;gap:0.55rem;align-items:center;">
              <a class="btn btn-primary btn-sm" href="${fieldGuide.youtubeVideos[0].url}" target="_blank" rel="noopener noreferrer">Watch on YouTube (${fieldGuide.youtubeVideos[0].channel}) &nearr;</a>
              <button type="button" class="btn btn-secondary btn-sm" data-open-guide="${fieldGuide.id}">Load in Drill Hub</button>
            </div>
          </article>
        </div>

        <div class="report-bottom-grid">
          <div class="card-subtle">
            <div class="meta-line">Bat Profile Fit</div>
            <h4 style="margin-bottom:0.35rem;">${report.recBat.name}</h4>
            <p style="margin-bottom:0.65rem;color:var(--text-secondary);font-size:0.92rem;">${report.recBat.reason}</p>
            <a class="btn btn-secondary btn-sm" href="index.html?bat=${encodeURIComponent(report.recBatId)}#gameday-studio">Open 3D Batter's Box</a>
          </div>
          <div class="card-subtle">
            <div class="meta-line">Your Schedule &amp; Style</div>
            <h4 style="margin-bottom:0.35rem;">${report.freq}</h4>
            <p style="margin-bottom:0;color:var(--text-secondary);font-size:0.92rem;">
              Goal: <strong>${report.goal}</strong> · Win Check: <strong>${report.winMetric}</strong>. Run <strong>${hitGuide.drills[0].name}</strong> + <strong>${fieldGuide.drills[0].name}</strong> using your ${report.gearSetup.toLowerCase()}.
            </p>
          </div>
          <div class="card-subtle">
            <div class="meta-line">Recommended Game Rule Study</div>
            <h4 style="margin-bottom:0.35rem;">Connect Practice to Game IQ</h4>
            <p style="margin-bottom:0.65rem;color:var(--text-secondary);font-size:0.92rem;">Pair your baseline drills with live diamond reads and rule breakdowns.</p>
            <a class="btn btn-secondary btn-sm" href="detail.html?id=${encodeURIComponent(hitGuide.scenarioId)}">Open Rule Scenario</a>
          </div>
        </div>
      `;

      reportWrapEl.querySelectorAll('[data-open-guide]').forEach((btn) => {
        btn.addEventListener('click', () => {
          selectClinic(btn.dataset.openGuide);
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
          savePlanBtn.textContent = 'Saving Baseline...';
          const title = `Baseline Profile: ${report.archetypeTitle}`;
          const body = [
            report.summary,
            '',
            `PLATE FOCUS: ${hitGuide.title}`,
            `Drill: ${hitGuide.drills[0].name} (${hitGuide.drills[0].reps}) — ${hitGuide.drills[0].cue}`,
            `YouTube: ${hitGuide.youtubeVideos[0].title} (${hitGuide.youtubeVideos[0].url})`,
            '',
            `DEFENSE FOCUS: ${fieldGuide.title}`,
            `Drill: ${fieldGuide.drills[0].name} (${fieldGuide.drills[0].reps}) — ${fieldGuide.drills[0].cue}`,
            `YouTube: ${fieldGuide.youtubeVideos[0].title} (${fieldGuide.youtubeVideos[0].url})`,
            '',
            `BAT FIT: ${report.recBat.name}`
          ].join('\n');
          try {
            const res = await fetch('/api/playbook', {
              method: 'POST',
              credentials: 'same-origin',
              headers: authHeaders({ 'Content-Type': 'application/json' }),
              body: JSON.stringify({ title, body, rating: 5 })
            });
            if (res.status === 401) {
              savePlanBtn.textContent = 'Log in to save baseline...';
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
          if (meta && !meta.textContent.includes('Noted')) {
            meta.textContent = `${meta.textContent} · Noted`;
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
        const missing = BASELINE_QUESTIONS.filter((q) => !answers[q.id]).map((q) => `Q${q.id}`);
        if (missing.length > 0) {
          if (quizErrorEl) {
            quizErrorEl.className = 'feedback-banner is-error';
            quizErrorEl.textContent = `Answer all 28 baseline questions so we get a complete picture (${missing.length} left: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '...' : ''}).`;
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
        const report = computeBaselineReport();
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
        const sample = [
          'b', 'a', 'a', 'b', 'b',
          'a', 'a', 'c', 'b', 'b', 'b', 'b',
          'b', 'b', 'b', 'b', 'b', 'b',
          'c', 'b', 'a', 'b', 'b',
          'a', 'b', 'a', 'a', 'b'
        ];
        BASELINE_QUESTIONS.forEach((q, idx) => {
          answers[q.id] = sample[idx] || 'a';
        });
        if (quizErrorEl) {
          quizErrorEl.className = 'feedback-banner';
          quizErrorEl.textContent = '';
        }
        renderQuizQuestions();
        const report = computeBaselineReport();
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

    try {
      const savedRaw = localStorage.getItem(QUIZ_STORAGE_KEY);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (parsed && parsed.answers) {
          for (const [k, v] of Object.entries(parsed.answers)) {
            answers[Number(k)] = v;
          }
          if (parsed.report && Object.keys(answers).length === BASELINE_QUESTIONS.length) {
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
