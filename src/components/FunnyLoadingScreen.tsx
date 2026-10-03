import React, { useState, useEffect, useRef } from 'react';

interface FunnyLoadingScreenProps {
  onFinish: () => void;
}

export const FunnyLoadingScreen: React.FC<FunnyLoadingScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [speechIdx, setSpeechIdx] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const hasTriggeredFinish = useRef(false);

  const speechBubbles = [
    "FAIL!!",
    "DO THE MATH!!",
    "WHERE IS CARRY?!",
    "NO ESCAPE!!",
    "FAIL!!",
  ];

  const funnyStatusLines = [
    "3D Yamraj pedaling at 99 km/h on an old squeaky bicycle! 🚲💨",
    "Sayan escaping into the 3rd dimension with COMA CALCULATOR! ⚡",
    "Yamraj's brass horn going HONK HONK in 3D surround sound! 📯",
    "Dodging division by zero at warp speed... 🏃‍♂️💨",
  ];

  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const handleInstantEnter = () => {
    if (!hasTriggeredFinish.current) {
      hasTriggeredFinish.current = true;
      setIsFadingOut(true);
      setTimeout(() => {
        onFinishRef.current();
      }, 150);
    }
  };

  useEffect(() => {
    let progressVal = 0;
    let isFinished = false;

    // Progress counter (completes strictly in ~1.0s)
    const timer = setInterval(() => {
      progressVal += 4;
      if (progressVal >= 100) {
        progressVal = 100;
        setProgress(100);
        clearInterval(timer);

        if (!isFinished && !hasTriggeredFinish.current) {
          isFinished = true;
          hasTriggeredFinish.current = true;
          setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => {
              onFinishRef.current();
            }, 200);
          }, 150);
        }
      } else {
        setProgress(progressVal);
      }
    }, 32);

    const speechTimer = setInterval(() => {
      setSpeechIdx((prev) => (prev + 1) % speechBubbles.length);
    }, 280);

    return () => {
      clearInterval(timer);
      clearInterval(speechTimer);
    };
  }, []);

  return (
    <div
      onClick={handleInstantEnter}
      title="Tap anywhere to enter immediately! ⚡"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-amber-500 via-orange-600 to-slate-950 px-3 select-none overflow-hidden cursor-pointer transition-all duration-300 ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{ perspective: '1200px' }}
    >
      {/* 3D FLOATING PARTICLES & MATH SYMBOLS IN FOREGROUND */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Glowing 3D Speed Lines */}
        {[8, 22, 38, 52, 68, 82].map((top, i) => (
          <div
            key={i}
            className="absolute h-1 bg-gradient-to-r from-transparent via-amber-200 to-transparent rounded-full opacity-60 animate-pulse"
            style={{
              top: `${top}%`,
              left: `${(i * 19) % 70}%`,
              width: `${120 + (i % 4) * 60}px`,
              transform: `translateZ(${40 + (i % 3) * 30}px) rotateY(-15deg)`,
              animationDuration: '0.5s',
              animationDelay: `${i * 0.08}s`,
            }}
          />
        ))}

        {/* Floating 3D Binary Bits & Math Flying towards Camera */}
        <span
          className="absolute top-16 left-8 text-2xl font-black text-yellow-300 drop-shadow-lg animate-bounce"
          style={{ transform: 'translateZ(90px) rotate(-10deg)', animationDuration: '0.8s' }}
        >
          01
        </span>
        <span
          className="absolute top-24 right-12 text-3xl font-black text-rose-300 drop-shadow-lg animate-bounce"
          style={{ transform: 'translateZ(110px) rotate(15deg)', animationDuration: '0.7s' }}
        >
          ≠ 0!
        </span>
        <span
          className="absolute bottom-24 left-16 text-2xl font-black text-cyan-300 drop-shadow-lg animate-bounce"
          style={{ transform: 'translateZ(80px) rotate(8deg)', animationDuration: '0.9s' }}
        >
          ÷ 0 💥
        </span>
        <span
          className="absolute bottom-32 right-10 text-2xl font-black text-amber-200 drop-shadow-lg animate-bounce"
          style={{ transform: 'translateZ(100px) rotate(-12deg)', animationDuration: '0.6s' }}
        >
          1010
        </span>
      </div>

      <div
        className="relative max-w-xl w-full flex flex-col items-center"
        style={{
          transformStyle: 'preserve-3d',
          transform: 'rotateX(4deg) rotateY(-2deg)',
        }}
      >
        {/* ============================================================ */}
        {/* 3D CARTOON CHASE SCENE CONTAINER */}
        {/* ============================================================ */}
        <div
          className="relative w-full h-64 sm:h-72 flex items-center justify-center overflow-visible"
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          {/* 3D Shadow Plate on Ground */}
          <div
            className="absolute bottom-4 w-4/5 h-8 bg-black/40 rounded-full blur-md"
            style={{
              transform: 'translateZ(-40px) rotateX(60deg)',
            }}
          />

          {/* SVG Vector 3D Multi-Layer Canvas */}
          <svg
            viewBox="0 0 640 280"
            className="w-full h-full drop-shadow-[0_20px_35px_rgba(0,0,0,0.6)] overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              transformStyle: 'preserve-3d',
            }}
          >
            <defs>
              {/* 3D Shader Gradients */}
              <linearGradient id="demonSkin3D" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="40%" stopColor="#ef4444" />
                <stop offset="85%" stopColor="#b91c1c" />
                <stop offset="100%" stopColor="#7f1d1d" />
              </linearGradient>

              <linearGradient id="goldCrown3D" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="35%" stopColor="#facc15" />
                <stop offset="70%" stopColor="#ca8a04" />
                <stop offset="100%" stopColor="#854d0e" />
              </linearGradient>

              <radialGradient id="bubble3DGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="80%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#e2e8f0" />
              </radialGradient>

              <filter id="pop3DShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="6" dy="8" stdDeviation="4" floodColor="#000" floodOpacity="0.55" />
              </filter>
            </defs>

            {/* LAYER 1: 3D DUST CLOUD BILLOWS (Z: -30px) */}
            <g
              className="animate-pulse"
              style={{
                animationDuration: '0.4s',
                transform: 'translateZ(-30px)',
              }}
            >
              <ellipse cx="90" cy="220" rx="35" ry="25" fill="#fde68a" opacity="0.8" />
              <ellipse cx="60" cy="208" rx="42" ry="30" fill="#fef3c7" opacity="0.9" />
              <ellipse cx="30" cy="195" rx="34" ry="26" fill="#fed7aa" opacity="0.75" />
              <ellipse cx="10" cy="180" rx="24" ry="18" fill="#ffedd5" opacity="0.65" />
              <ellipse cx="115" cy="235" rx="22" ry="15" fill="#fde68a" opacity="0.7" />
              {/* 3D Dust motion lines */}
              <line x1="15" y1="212" x2="75" y2="212" stroke="#b45309" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="8" y1="196" x2="60" y2="196" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
            </g>

            {/* LAYER 2: CHUBBY RED DEMON / YAMRAJ ON BICYCLE (Z: 25px) */}
            <g
              className="animate-bounce"
              style={{
                animationDuration: '0.38s',
                transform: 'translateZ(25px)',
              }}
            >
              {/* 3D BICYCLE */}
              {/* Back Wheel (Spinning with 3D Rim bevel) */}
              <circle cx="130" cy="220" r="37" stroke="#0f172a" strokeWidth="7" fill="#fb923c" fillOpacity="0.25" />
              <circle cx="130" cy="220" r="33" stroke="#94a3b8" strokeWidth="2" fill="none" />
              <circle cx="130" cy="220" r="9" fill="#111827" />
              {/* Spokes */}
              <line x1="130" y1="183" x2="130" y2="257" stroke="#64748b" strokeWidth="2" />
              <line x1="93" y1="220" x2="167" y2="220" stroke="#64748b" strokeWidth="2" />
              <line x1="104" y1="194" x2="156" y2="246" stroke="#64748b" strokeWidth="2" />
              <line x1="104" y1="246" x2="156" y2="194" stroke="#64748b" strokeWidth="2" />

              {/* Front Wheel (Spinning) */}
              <circle cx="250" cy="220" r="37" stroke="#0f172a" strokeWidth="7" fill="#fb923c" fillOpacity="0.25" />
              <circle cx="250" cy="220" r="33" stroke="#94a3b8" strokeWidth="2" fill="none" />
              <circle cx="250" cy="220" r="9" fill="#111827" />
              <line x1="250" y1="183" x2="250" y2="257" stroke="#64748b" strokeWidth="2" />
              <line x1="213" y1="220" x2="287" y2="220" stroke="#64748b" strokeWidth="2" />
              <line x1="224" y1="194" x2="276" y2="246" stroke="#64748b" strokeWidth="2" />
              <line x1="224" y1="246" x2="276" y2="194" stroke="#64748b" strokeWidth="2" />

              {/* Frame with 3D Tube Highlights */}
              <polygon points="130,220 185,220 220,165 165,165" stroke="#020617" strokeWidth="7" fill="none" strokeLinejoin="round" />
              <line x1="185" y1="220" x2="250" y2="220" stroke="#020617" strokeWidth="6" />
              <line x1="220" y1="165" x2="250" y2="220" stroke="#020617" strokeWidth="6" />

              {/* Handlebar & Brass Squeeze Horn */}
              <path d="M 220 165 L 215 138 L 236 136" stroke="#1e293b" strokeWidth="5.5" fill="none" strokeLinecap="round" />
              {/* Squeeze Horn */}
              <path d="M 236 136 L 258 131 L 268 122 L 268 144 Z" fill="url(#goldCrown3D)" stroke="#854d0e" strokeWidth="2" />
              <circle cx="230" cy="138" r="7" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
              {/* Sound waves from Horn */}
              <path d="M 272 128 C 276 133 276 139 272 144" stroke="#fef08a" strokeWidth="2.5" fill="none" />
              <path d="M 277 124 C 283 133 283 145 277 150" stroke="#fef08a" strokeWidth="2.5" fill="none" />

              {/* Pedals & Chain Wheel */}
              <circle cx="185" cy="220" r="11" fill="#334155" />
              <line x1="185" y1="220" x2="196" y2="236" stroke="#94a3b8" strokeWidth="4.5" />
              <rect x="190" y="235" width="14" height="6" rx="2" fill="#0f172a" />

              {/* Seat */}
              <path d="M 154 160 C 148 153 182 153 176 160 Z" fill="#3f1d0b" stroke="#000" strokeWidth="2.5" />

              {/* YAMRAJ'S CHUBBY 3D BODY */}
              {/* Yellow Dhoti */}
              <path d="M 150 165 C 145 190 165 215 190 225 C 205 210 200 180 190 165 Z" fill="#fef08a" stroke="#ca8a04" strokeWidth="3" />
              <ellipse cx="196" cy="235" rx="8" ry="5.5" fill="url(#demonSkin3D)" />

              {/* 3D Round Red Belly */}
              <ellipse cx="185" cy="135" rx="36" ry="33" fill="url(#demonSkin3D)" stroke="#991b1b" strokeWidth="3.5" />
              {/* 3D Belly Highlight & Shadow */}
              <ellipse cx="178" cy="128" rx="18" ry="14" fill="#f87171" opacity="0.35" />
              <circle cx="192" cy="146" r="2.8" fill="#581c1c" />

              {/* Arms Gripping Handlebar */}
              <path d="M 175 105 C 190 115 210 120 225 135" stroke="url(#demonSkin3D)" strokeWidth="13" strokeLinecap="round" fill="none" />
              <rect x="184" y="104" width="9" height="13" rx="2" fill="url(#goldCrown3D)" stroke="#713f12" strokeWidth="1.5" />

              {/* Demon Head */}
              <circle cx="185" cy="85" r="27" fill="url(#demonSkin3D)" stroke="#991b1b" strokeWidth="3.5" />

              {/* Furious 3D Mustache */}
              <path d="M 164 93 Q 185 88 185 97 Q 185 88 206 93 Q 214 100 206 103 Q 185 97 185 98 Q 185 97 164 103 Q 156 100 164 93 Z" fill="#09090b" stroke="#000" strokeWidth="1.5" />

              {/* Bulging Eyes with 3D Specular Dots */}
              <circle cx="177" cy="80" r="7.5" fill="#fff" stroke="#000" strokeWidth="2" />
              <circle cx="179" cy="80" r="3.5" fill="#000" />
              <circle cx="180" cy="78" r="1.2" fill="#fff" />

              <circle cx="194" cy="80" r="7.5" fill="#fff" stroke="#000" strokeWidth="2" />
              <circle cx="196" cy="80" r="3.5" fill="#000" />
              <circle cx="197" cy="78" r="1.2" fill="#fff" />

              {/* Angry Eyebrows */}
              <line x1="170" y1="70" x2="185" y2="76" stroke="#000" strokeWidth="4" strokeLinecap="round" />
              <line x1="202" y1="70" x2="187" y2="76" stroke="#000" strokeWidth="4" strokeLinecap="round" />

              {/* 3D Golden Mukut (Crown) */}
              <polygon points="162,68 185,28 208,68" fill="url(#goldCrown3D)" stroke="#713f12" strokeWidth="2.5" />
              <circle cx="185" cy="54" r="5" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
              <polygon points="171,68 185,40 199,68" fill="#fef9c3" />
              <rect x="162" y="65" width="46" height="7" rx="2" fill="url(#goldCrown3D)" stroke="#713f12" strokeWidth="1.5" />

              {/* Sweat Drops Flying */}
              <path d="M 158 68 C 156 63 150 68 154 73 Z" fill="#38bdf8" />
              <path d="M 160 52 C 158 47 152 52 156 57 Z" fill="#38bdf8" />
              <path d="M 214 68 C 216 63 222 68 218 73 Z" fill="#38bdf8" />
            </g>

            {/* LAYER 3: 3D POP-OUT "FAIL!!" SPEECH BUBBLE (Z: 75px) */}
            <g
              className="animate-bounce"
              style={{
                animationDuration: '0.5s',
                transform: 'translateZ(75px)',
              }}
            >
              {/* 3D Extruded Depth Underlayer */}
              <path
                d="M 243 77 Q 238 37 318 37 Q 398 37 398 77 Q 398 117 318 117 L 286 117 L 253 134 L 268 114 Q 243 110 243 77 Z"
                fill="#0f172a"
              />
              {/* White Comic Balloon */}
              <path
                d="M 240 73 Q 235 33 315 33 Q 395 33 395 73 Q 395 113 315 113 L 285 113 L 252 130 L 266 110 Q 240 106 240 73 Z"
                fill="url(#bubble3DGlow)"
                stroke="#0f172a"
                strokeWidth="4.5"
                filter="url(#pop3DShadow)"
              />
              {/* Red 3D Extruded Text */}
              <text
                x="319"
                y="83"
                textAnchor="middle"
                fontSize={speechBubbles[speechIdx].length <= 6 ? "38" : speechBubbles[speechIdx].length <= 10 ? "24" : "18"}
                fontWeight="900"
                fontFamily="Impact, Arial Black, sans-serif"
                fill="#7f1d1d"
              >
                {speechBubbles[speechIdx]}
              </text>
              <text
                x="317"
                y="81"
                textAnchor="middle"
                fontSize={speechBubbles[speechIdx].length <= 6 ? "38" : speechBubbles[speechIdx].length <= 10 ? "24" : "18"}
                fontWeight="900"
                fontFamily="Impact, Arial Black, sans-serif"
                fill="#dc2626"
                stroke="#b91c1c"
                strokeWidth="1.2"
                letterSpacing="1"
              >
                {speechBubbles[speechIdx]}
              </text>
              {/* 3D Lightning Sparks */}
              <path d="M 392 42 L 406 48 L 397 54 L 412 62" stroke="#eab308" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            </g>

            {/* LAYER 4: CLEAN, HANDSOME, ENERGETIC HERO BOY (SAYAN) */}
            <g
              className="animate-bounce"
              style={{
                animationDuration: '0.32s',
                transform: 'translateZ(50px)',
              }}
            >
              {/* Dynamic Run Dust & Speed Streaks */}
              <ellipse cx="495" cy="226" rx="34" ry="7" fill="#fde68a" opacity="0.6" />
              <line x1="420" y1="220" x2="470" y2="220" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="435" y1="230" x2="485" y2="230" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />

              {/* ATHLETIC SPRINTING LEGS */}
              {/* Back Leg (Extended back in sprint) */}
              <path d="M 470 174 L 442 195 L 428 182" stroke="#fed7aa" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              {/* White Sock with Red Trim (Back) */}
              <rect x="424" y="178" width="8" height="6" rx="1" fill="#ffffff" stroke="#ef4444" strokeWidth="1" />
              {/* Colorful Sneaker (Back: Cyan, Red, Yellow) */}
              <path d="M 416 178 L 434 176 L 436 186 L 412 188 Z" fill="#ef4444" stroke="#0f172a" strokeWidth="1.5" />
              <path d="M 420 176 L 432 176 L 433 182 L 418 183 Z" fill="#0284c7" />
              <rect x="412" y="186" width="25" height="3.5" rx="1" fill="#facc15" stroke="#0f172a" strokeWidth="1" />

              {/* Front Leg (Pumping forward in sprint) */}
              <path d="M 486 174 L 518 196 L 536 222" stroke="#fed7aa" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              {/* White Sock with Red Trim (Front) */}
              <rect x="532" y="216" width="9" height="7" rx="1" fill="#ffffff" stroke="#ef4444" strokeWidth="1" />
              {/* Colorful Sneaker (Front: Cyan, Red, Yellow) */}
              <path d="M 526 220 L 552 222 L 550 232 L 522 230 Z" fill="#ef4444" stroke="#0f172a" strokeWidth="1.5" />
              <path d="M 532 220 L 548 221 L 547 227 L 528 226 Z" fill="#0284c7" />
              <rect x="522" y="230" width="31" height="4" rx="1.5" fill="#facc15" stroke="#0f172a" strokeWidth="1" />

              {/* KHAKI CARGO SHORTS */}
              <path
                d="M 462 146 L 498 146 L 504 176 L 488 178 L 480 166 L 472 178 L 456 172 Z"
                fill="#65a30d"
                stroke="#3f6212"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* Cargo Pocket flap */}
              <rect x="488" y="156" width="7" height="8" rx="1.5" fill="#4d7c0f" stroke="#365314" strokeWidth="1" />

              {/* STRIPED CREWNECK T-SHIRT (Yellow & Cyan-Blue Stripes) */}
              <rect x="466" y="115" width="30" height="34" rx="4" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
              <rect x="466" y="122" width="30" height="5" fill="#0284c7" />
              <rect x="466" y="134" width="30" height="5" fill="#0284c7" />

              {/* UNBUTTONED DENIM BLUE SHIRT/JACKET */}
              {/* Left wing flying open in wind */}
              <path d="M 462 112 C 445 125 448 146 462 150 Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
              {/* Right wing flying open */}
              <path d="M 496 112 C 506 125 502 146 494 150 Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
              {/* Shirt Collar */}
              <polygon points="466,112 458,118 468,121" fill="#60a5fa" stroke="#1d4ed8" strokeWidth="1" />
              <polygon points="494,112 502,118 492,121" fill="#60a5fa" stroke="#1d4ed8" strokeWidth="1" />

              {/* RIGHT ARM (Pumping back in dynamic sprint) */}
              <path d="M 466 116 L 442 125 L 434 140" stroke="#fed7aa" strokeWidth="9.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              {/* Rolled-up denim sleeve */}
              <rect x="456" y="116" width="8" height="8" rx="2" fill="#2563eb" />
              {/* Blue Sports Watch on wrist */}
              <rect x="436" y="130" width="5.5" height="5.5" rx="1.5" fill="#0284c7" stroke="#0f172a" strokeWidth="1" />
              {/* Handsome athletic clenched fist */}
              <circle cx="433" cy="142" r="5" fill="#fed7aa" stroke="#d97706" strokeWidth="1" />

              {/* LEFT ARM (Forward holding the COMA CALCULATOR) */}
              <path d="M 486 116 L 522 122 L 536 108" stroke="#fed7aa" strokeWidth="9.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <rect x="488" y="116" width="8" height="8" rx="2" fill="#2563eb" />
              {/* Hand clutching the COMA CALCULATOR */}
              <circle cx="536" cy="108" r="5" fill="#fed7aa" stroke="#d97706" strokeWidth="1" />
              {/* Mini COMA CALCULATOR in hand */}
              <g transform="translate(534, 90) rotate(-12)">
                <rect x="0" y="0" width="22" height="28" rx="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                <rect x="3" y="3" width="16" height="8" rx="2" fill="#06b6d4" />
                <text x="11" y="9" textAnchor="middle" fontSize="5.5" fontWeight="900" fontFamily="monospace" fill="#ffffff">
                  COMA
                </text>
                <circle cx="6" cy="16" r="1.5" fill="#facc15" />
                <circle cx="11" cy="16" r="1.5" fill="#facc15" />
                <circle cx="16" cy="16" r="1.5" fill="#38bdf8" />
                <rect x="4" y="21" width="14" height="3.5" rx="1" fill="#10b981" />
              </g>

              {/* ==================================================== */}
              {/* HANDSOME, CHARMING CARTOON BOY FACE (Matching reference) */}
              {/* ==================================================== */}
              {/* Warm, smooth peachy head */}
              <ellipse cx="488" cy="85" rx="23" ry="24" fill="#fed7aa" stroke="#d97706" strokeWidth="2" />
              {/* Cute soft rosy cheeks */}
              <ellipse cx="476" cy="91" rx="5" ry="3" fill="#fbcfe8" opacity="0.6" />
              <ellipse cx="498" cy="91" rx="5" ry="3" fill="#fbcfe8" opacity="0.6" />

              {/* BIG, DAZZLING HANDSOME CARTOON SMILE */}
              <path
                d="M 478 88 Q 488 103 498 88 Z"
                fill="#b91c1c"
                stroke="#0f172a"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              {/* Clean White Teeth */}
              <path d="M 479 88 Q 488 94 497 88 Z" fill="#ffffff" />

              {/* CHARMING EYES (Winking cheerfully like reference image) */}
              {/* Left Eye: Smooth cheerful curved wink */}
              <path
                d="M 473 81 Q 480 75 485 82"
                stroke="#0f172a"
                strokeWidth="3.2"
                strokeLinecap="round"
                fill="none"
              />
              {/* Left Eyelash accent */}
              <line x1="484" y1="80" x2="487" y2="78" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />

              {/* Right Eye: Big, bright, sparkling brown anime/cartoon eye */}
              <ellipse cx="496" cy="80" rx="6.5" ry="7.5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
              {/* Warm Chestnut Brown Iris */}
              <ellipse cx="495" cy="80" rx="4.2" ry="5.2" fill="#78350f" />
              {/* Black Pupil */}
              <circle cx="494.5" cy="80" r="3" fill="#0f172a" />
              {/* Big, sparkling white specular glint */}
              <circle cx="493.5" cy="78" r="1.8" fill="#ffffff" />
              <circle cx="496" cy="82" r="0.9" fill="#ffffff" />

              {/* Friendly, arched cartoon eyebrows */}
              <path d="M 472 73 Q 479 69 484 74" stroke="#451a03" strokeWidth="2.8" strokeLinecap="round" fill="none" />
              <path d="M 491 73 Q 497 68 503 73" stroke="#451a03" strokeWidth="2.8" strokeLinecap="round" fill="none" />

              {/* Cute little button nose */}
              <path d="M 487 81 Q 489 83 487 85" stroke="#d97706" strokeWidth="2" strokeLinecap="round" fill="none" />

              {/* TOUSLED CHESTNUT BROWN ANIME HAIR SPIKES */}
              <path
                d="M 466 74 Q 456 54 476 60 Q 484 42 502 54 Q 514 42 516 64 Q 510 66 504 64 Q 498 58 490 65 Q 478 62 472 72 Z"
                fill="#78350f"
                stroke="#451a03"
                strokeWidth="1.5"
              />
              {/* Front hair tufts poking out beneath the cap */}
              <path d="M 474 68 Q 480 78 484 72" stroke="#78350f" strokeWidth="2.8" strokeLinecap="round" fill="none" />
              <path d="M 488 66 Q 492 74 496 68" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" fill="none" />

              {/* RED BASEBALL CAP (Worn Backwards) */}
              {/* Rounded Cap Crown */}
              <path d="M 468 66 C 468 46 510 46 510 66 Z" fill="#ef4444" stroke="#0f172a" strokeWidth="2" />
              {/* Button on top of cap */}
              <ellipse cx="489" cy="46" rx="2.5" ry="1.5" fill="#dc2626" />
              {/* Backwards Visor jutting back with clean perspective */}
              <path d="M 468 68 L 444 74 L 452 80 L 470 72 Z" fill="#dc2626" stroke="#0f172a" strokeWidth="2" />
              {/* Clean Front Badge: "SAYAN" */}
              <rect x="476" y="60" width="30" height="9" rx="2" fill="#0284c7" stroke="#0f172a" strokeWidth="1.2" />
              <text x="491" y="67" textAnchor="middle" fontSize="6" fontWeight="900" fontFamily="sans-serif" fill="#ffffff" letterSpacing="0.5">
                SAYAN
              </text>

              {/* Flying Cartoon Sweat Droplets (From running fast) */}
              <path d="M 518 70 C 521 66 527 70 523 74 Z" fill="#38bdf8" />
              <path d="M 515 84 C 518 80 524 84 520 88 Z" fill="#38bdf8" />
              <path d="M 464 68 C 461 64 455 68 459 72 Z" fill="#38bdf8" />
            </g>

            {/* DUST GROUND RUNWAY */}
            <line x1="0" y1="256" x2="640" y2="256" stroke="#92400e" strokeWidth="6" />
            <line x1="30" y1="262" x2="210" y2="262" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="270" y1="262" x2="590" y2="262" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* ============================================================ */}
        {/* TITLES & ATTRIBUTION IN 3D PERSPECTIVE */}
        {/* ============================================================ */}
        <div
          className="flex flex-col items-center text-center mt-1 mb-2"
          style={{
            transform: 'translateZ(60px)',
          }}
        >
          {/* Main 3D App Title */}
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]">
            COMA <span className="text-yellow-300 drop-shadow-[0_0_20px_rgba(234,179,8,0.9)]">CALCULATOR</span>
          </h1>

          {/* CREATED BY SAYAN BADGE */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/90 border border-yellow-400/80 shadow-2xl shadow-black mt-1.5">
            <span className="text-sm animate-bounce">🏃‍♂️💨</span>
            <span className="font-extrabold text-xs sm:text-sm tracking-wide text-white">
              Created by <span className="text-yellow-300 font-black underline decoration-wavy decoration-red-500">Sayan</span>
            </span>
            <span className="text-xs">📯</span>
          </div>
        </div>

        {/* 3D Status Banner */}
        <div
          className="w-full max-w-md bg-slate-950/90 border border-amber-500/50 px-3.5 py-1.5 rounded-xl shadow-2xl text-center mb-2"
          style={{ transform: 'translateZ(40px)' }}
        >
          <p className="text-xs font-mono font-bold text-amber-200 truncate animate-pulse">
            {funnyStatusLines[speechIdx % funnyStatusLines.length]}
          </p>
        </div>

        {/* 3D COMIC PROGRESS BAR */}
        <div
          className="w-full max-w-md bg-slate-950 border-2 border-amber-400 rounded-full h-4 p-0.5 shadow-2xl mb-1.5 overflow-hidden relative"
          style={{ transform: 'translateZ(50px)' }}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300 transition-all duration-100 relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/40 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Bottom Escape Velocity Tracker */}
        <div
          className="text-[11px] font-mono font-black text-amber-100 flex items-center gap-1.5 drop-shadow-md"
          style={{ transform: 'translateZ(30px)' }}
        >
          <span>3D ESCAPE VELOCITY:</span>
          <span className="text-yellow-300 text-xs font-black">{progress}%</span>
          <span>(YAMRAJ OVERHEATING!)</span>
        </div>

        {/* Tap to enter hint */}
        <div
          className="mt-2 text-[10px] font-mono font-semibold text-yellow-200/80 tracking-wider flex items-center gap-1 bg-black/40 px-2.5 py-0.5 rounded-full border border-yellow-400/20"
          style={{ transform: 'translateZ(35px)' }}
        >
          <span>⚡ Tap anywhere to enter</span>
        </div>
      </div>
    </div>
  );
};
