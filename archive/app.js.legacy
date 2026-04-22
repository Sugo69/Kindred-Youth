<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Exodus Family Feud - Pro Sync</title>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Permanent+Marker&family=Rajdhani:wght@500;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-dark: #0a0a12;
            --neon-pink: #ff007f;
            --neon-purple: #9d00ff;
            --neon-cyan: #00f2ff;
            --warning-gold: #ffcc00;
            --text-silver: #e0e0e0;
            --border-glow: 0 0 30px rgba(0, 242, 255, 0.4);
            --monitor-scale: 1.0;
        }

        body {
            font-family: 'Rajdhani', sans-serif;
            background-color: var(--bg-dark);
            color: var(--text-silver);
            margin: 0;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            overflow-x: hidden;
            background-image: 
                linear-gradient(rgba(10, 10, 18, 0.98), rgba(10, 10, 18, 0.98)),
                repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 242, 255, 0.03) 2px, rgba(0, 242, 255, 0.03) 4px);
        }

        html { font-size: 18px; }

        /* Monitor Scaling - This root adjusts based on em units for proportionality */
        .monitor-scaling-root {
            font-size: calc(18px * var(--monitor-scale));
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            transition: font-size 0.2s ease-out;
        }

        /* Start Screen Layout */
        #audio-unlock {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 20px;
            box-sizing: border-box;
        }
        #audio-unlock h1 { font-size: 4rem; color: var(--neon-cyan); margin-bottom: 2rem; font-family: 'Orbitron', sans-serif; }
        #audio-unlock button {
            font-size: 2rem; padding: 20px 50px; background: var(--neon-cyan);
            color: black; border: none; font-family: 'Orbitron', sans-serif; cursor: pointer;
            border-radius: 12px; box-shadow: 0 0 30px var(--neon-cyan);
            text-transform: uppercase; font-weight: bold;
        }

        /* Settings Slide-out */
        .view-switcher {
            position: fixed; top: 10px; right: 10px; z-index: 6000;
            display: flex; flex-direction: column; background: rgba(10, 10, 20, 0.98);
            border: 2px solid var(--neon-cyan); box-shadow: 0 0 40px rgba(0,0,0,1);
            border-radius: 15px; overflow: hidden; transform: translateX(125%);
            transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); width: 280px;
            padding: 15px 0;
        }
        .view-switcher.visible { transform: translateX(0); }

        .view-btn {
            background: transparent; border: none; border-bottom: 1px solid #222;
            color: var(--neon-cyan); padding: 18px 20px; cursor: pointer;
            font-size: 1rem; font-family: 'Orbitron', sans-serif;
            text-transform: uppercase; text-align: left;
        }
        .view-btn:hover { background: rgba(0, 242, 255, 0.1); }
        .view-btn.active { background: var(--neon-cyan); color: black; font-weight: bold; }
        
        .settings-label { color: #888; font-size: 0.75rem; padding: 20px 20px 8px 20px; font-family: 'Orbitron', sans-serif; text-transform: uppercase; letter-spacing: 2px; }
        
        .slider-container { padding: 5px 20px 25px 20px; border-bottom: 1px solid #222; }
        input[type=range] { width: 100%; -webkit-appearance: none; background: #333; height: 8px; border-radius: 4px; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 24px; width: 24px; border-radius: 50%; background: var(--neon-cyan); cursor: pointer; border: 2px solid white; box-shadow: 0 0 10px var(--neon-cyan); }

        #menu-trigger {
            position: fixed; top: 10px; right: 10px; z-index: 5999;
            background: rgba(10, 10, 20, 0.8); color: var(--neon-cyan);
            border: 2px solid var(--neon-cyan); width: 50px; height: 50px;
            display: flex; align-items: center; justify-content: center;
            border-radius: 10px; cursor: pointer; font-size: 1.4rem;
            box-shadow: 0 0 15px rgba(0, 242, 255, 0.3);
        }

        /* Content Visibility */
        .admin-only, .contestant-only { display: none; }
        body.mode-admin .admin-only { display: block; width: 100%; max-width: 850px; margin: 0 auto; padding-bottom: 140px; padding-top: 20px; box-sizing: border-box; }
        body.mode-contestant .contestant-only { display: flex; flex-direction: column; align-items: center; width: 100%; }
        body.mode-contestant .bottom-hud { display: flex; }

        .container { max-width: 1400px; width: 95%; text-align: center; padding: 1em; box-sizing: border-box; margin-top: 1em; }

        /* TV Elements using 'em' for dynamic scale */
        h1.tv-title { font-family: 'Orbitron', sans-serif; font-size: 3.5em; margin: 0; color: var(--neon-pink); text-transform: uppercase; letter-spacing: 0.2em; text-shadow: 0 0 30px var(--neon-pink); font-style: italic; }

        .subtitle.tv-sub {
            font-family: 'Permanent Marker', cursive; color: var(--neon-cyan); font-size: 1.8em;
            margin-bottom: 1.2em; text-transform: uppercase; display: flex; align-items: center; justify-content: center; gap: 0.8em;
        }
        .faceoff-icon { font-size: 1.2em; display: none; filter: drop-shadow(0 0 15px var(--neon-cyan)); }

        .question-box.tv-q {
            background: rgba(20, 20, 50, 0.95); border: 0.15em solid var(--neon-cyan);
            padding: 1em 1.5em; margin-bottom: 1em; font-size: 3.8em;
            line-height: 1.15; min-height: 4.5em; display: flex; align-items: center;
            justify-content: center; box-shadow: var(--border-glow); clip-path: polygon(2% 0, 100% 0, 98% 100%, 0 100%);
        }

        .board.tv-board { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8em; margin-bottom: 2em; perspective: 2000px; width: 100%; }

        .answer-slot { height: 5.2em; position: relative; transform-style: preserve-3d; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
        .answer-slot.revealed { transform: rotateY(180deg); }

        .front, .back {
            position: absolute; width: 100%; height: 100%; backface-visibility: hidden;
            display: flex; align-items: center; padding: 0 1.5em; box-sizing: border-box;
            border: 0.15em solid var(--neon-purple); font-size: 1.8em; text-transform: uppercase; font-weight: 700; overflow: hidden;
        }
        .front { background: linear-gradient(135deg, #1a1a2e 0%, #2e1a47 100%); color: var(--neon-purple); justify-content: center; border-radius: 0.2em; }
        .back { background: linear-gradient(135deg, var(--neon-cyan) 0%, #008080 100%); color: white; justify-content: space-between; transform: rotateY(180deg); border-color: #fff; border-radius: 0.2em; }

        .pts-badge { background: rgba(0, 0, 0, 0.8); color: var(--neon-pink); padding: 0.2em 0.8em; border: 0.1em solid var(--neon-pink); font-family: 'Orbitron', sans-serif; font-size: 0.85em; }

        .strike-tracker { display: flex; gap: 0.8em; margin: 0.8em 0; justify-content: center; }
        .strike-x { font-size: 3.5em; color: #1a1a2e; font-family: 'Orbitron', sans-serif; border: 0.1em solid #1a1a2e; width: 1.8em; height: 1.8em; display: flex; align-items: center; justify-content: center; transition: 0.3s; }
        .strike-x.active { color: var(--warning-gold); border-color: var(--warning-gold); text-shadow: 0 0 20px var(--warning-gold); box-shadow: 0 0 30px rgba(255, 204, 0, 0.6); }

        .bottom-hud { display: none; justify-content: space-between; align-items: flex-end; width: 100%; margin-top: auto; padding: 1.2em 4em; background: rgba(0,0,0,0.95); border-top: 0.25em solid var(--neon-purple); box-sizing: border-box; }
        .score-side { flex: 1; max-width: 25em; transition: transform 0.3s; }
        .score-num { font-family: 'Orbitron', sans-serif; font-size: 5.5em; line-height: 1; margin-bottom: 0.1em; }
        .score-name { font-size: 1.2em; font-weight: bold; letter-spacing: 0.2em; text-transform: uppercase; }

        .active-glow { border: 0.2em solid var(--neon-cyan); box-shadow: 0 0 60px var(--neon-cyan); background: rgba(0, 242, 255, 0.15); padding: 0.8em; border-radius: 0.8em; transform: scale(1.05); }

        /* Banners */
        #alert-steal, #alert-win, #game-over-pop, #alert-switch { 
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 3em; font-family: 'Orbitron', sans-serif; display: none; z-index: 7100; text-align: center; width: 90%; 
        }
        #alert-steal { background: var(--neon-pink); color: white; box-shadow: 0 0 150px var(--neon-pink); font-size: 5.5em; }
        #alert-win { background: var(--neon-cyan); color: black; box-shadow: 0 0 300px var(--neon-cyan); font-size: 5.5em; }
        #alert-switch { background: var(--warning-gold); color: black; box-shadow: 0 0 300px var(--warning-gold); font-size: 5.5em; border: 0.2em solid white; }
        #game-over-pop { background: #000; color: var(--neon-cyan); border: 0.4em solid var(--neon-cyan); box-shadow: 0 0 400px var(--neon-cyan); font-size: 4em; }

        /* Admin UI styling (iPhone friendly) */
        .admin-box { background: #1a1a35; padding: 20px; border-radius: 15px; margin-bottom: 15px; border: 2px solid #444; }
        .btn-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .admin-btn { font-family: 'Orbitron', sans-serif; background: transparent; border: 2px solid var(--neon-cyan); color: var(--neon-cyan); padding: 14px; cursor: pointer; text-transform: uppercase; font-size: 0.95rem; flex: 1; min-width: 130px; border-radius: 10px; }
        .admin-btn.selected { background: var(--neon-cyan); color: black; box-shadow: 0 0 15px var(--neon-cyan); }
        .danger { border-color: var(--warning-gold); color: var(--warning-gold); }

        .admin-ans-card { background: #0a0a1a; padding: 15px; display: flex; justify-content: space-between; align-items: center; border-left: 6px solid var(--neon-purple); margin-bottom: 10px; border-radius: 12px; box-sizing: border-box; }
        .admin-ans-card div { flex: 1; padding-right: 10px; color: white; }
        .admin-ans-card button { background: var(--neon-cyan); color: black; font-weight: bold; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; min-width: 90px; font-family: 'Orbitron', sans-serif; font-size: 0.8rem; }
        .admin-ans-card button:disabled { background: transparent; color: #444; border: 1px solid #333; opacity: 1; cursor: default; }

        input[type="text"] { flex: 1; padding: 15px; background: black; color: white; border: 2px solid var(--neon-purple); font-size: 1.1rem; font-family: 'Orbitron', sans-serif; width: 100%; box-sizing: border-box; border-radius: 8px; }

        @media (max-width: 800px) {
            .admin-ans-card { flex-direction: column; align-items: stretch; gap: 12px; }
            .admin-ans-card button { width: 100%; height: 50px; font-size: 1rem; }
            #admin-q-display { font-size: 1rem; line-height: 1.4; margin-top: 10px; color: #00f2ff; font-weight: bold; display: block; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; }
        }
    </style>
</head>
<body class="mode-contestant">

    <div id="audio-unlock">
        <h1>Exodus Feud</h1>
        <button onclick="startApp()">START GAME</button>
        <p style="color: #666; margin-top: 30px; font-size: 1.2rem;">Syncing Pro Session...</p>
    </div>

    <div id="menu-trigger" onclick="toggleSwitcher()">⚙️</div>

    <div class="view-switcher" id="main-switcher">
        <button class="view-btn active" id="btn-con" onclick="setView('contestant')">Monitor View (TV)</button>
        <button class="view-btn" id="btn-adm" onclick="setView('admin')">Admin mode</button>
        
        <div class="settings-label">Monitor Zoom / Scale</div>
        <div class="slider-container">
            <input type="range" id="res-slider" min="0.4" max="1.6" step="0.05" value="1.0" oninput="window.cloudUpdate({monitorScale: parseFloat(this.value)})">
        </div>
        
        <button class="view-btn reset-action" style="margin-top:20px;" id="reset-button" onclick="handleResetClick()">⚠️ Full Game Reset</button>
        <button class="view-btn close-btn" onclick="toggleSwitcher()" style="background:#000; text-align:center; font-size:0.7rem; border-top:1px solid #333;">Close Menu</button>
    </div>

    <div class="monitor-scaling-root" id="scale-root">
        <div class="container">
            <!-- MONITOR VIEW -->
            <div class="contestant-only">
                <h1 class="tv-title">Exodus Family Feud</h1>
                <div class="subtitle tv-sub">
                    <span class="faceoff-icon" id="tv-fo-icon">⚔️</span>
                    <span id="round-label">Round 1</span>
                    <span class="faceoff-icon" id="tv-fo-icon-2">⚔️</span>
                </div>
                <div class="strike-tracker">
                    <div class="strike-x" id="sx-1">X</div>
                    <div class="strike-x" id="sx-2">X</div>
                    <div class="strike-x" id="sx-3">X</div>
                </div>
                <div class="question-box tv-q" id="q-txt">Connecting to Temple...</div>
                <div class="board tv-board" id="game-board"></div>
            </div>

            <!-- ADMIN VIEW -->
            <div class="admin-only">
                <div class="admin-box">
                    <h3 style="color:var(--neon-cyan); margin:0;">1. Teams & Scoring</h3>
                    <div class="btn-grid">
                        <div style="flex:1">
                            <input type="text" id="in-n1" placeholder="Team 1" onchange="window.cloudUpdate({t1Name: this.value})">
                            <div class="btn-grid" style="margin-top:10px">
                                <button class="admin-btn" onclick="adjustScore(1, -5)">-5</button>
                                <button class="admin-btn" onclick="adjustScore(1, 5)">+5</button>
                                <button class="admin-btn" style="border-color:var(--neon-pink); color:var(--neon-pink);" onclick="handleManualWin(1)">Win Round</button>
                            </div>
                        </div>
                        <div style="flex:1">
                            <input type="text" id="in-n2" placeholder="Team 2" onchange="window.cloudUpdate({t2Name: this.value})">
                            <div class="btn-grid" style="margin-top:10px">
                                <button class="admin-btn" onclick="adjustScore(2, -5)">-5</button>
                                <button class="admin-btn" onclick="adjustScore(2, 5)">+5</button>
                                <button class="admin-btn" style="border-color:var(--neon-pink); color:var(--neon-pink);" onclick="handleManualWin(2)">Win Round</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="admin-box">
                    <h3 style="color:var(--warning-gold); margin:0;">2. Match Play</h3>
                    <div id="steal-status" class="steal-label" style="display:none;">⚠️ STEAL ACTIVE!</div>
                    <div class="btn-grid">
                        <button id="h-fo" class="admin-btn" onclick="window.cloudUpdate({activeTeam: 0, strikes: 0})">Face-Off Mode</button>
                        <button id="h-t1" class="admin-btn" onclick="window.cloudUpdate({activeTeam: 1, originalTeamId: 1})">Light Playing</button>
                        <button id="h-t2" class="admin-btn" onclick="window.cloudUpdate({activeTeam: 2, originalTeamId: 2})">Star Playing</button>
                    </div>
                    <div class="btn-grid">
                        <button class="admin-btn danger" style="padding: 35px;" onclick="window.sendStrike()">WRONG ANSWER (X)</button>
                        <button class="admin-btn" onclick="window.cloudUpdate({strikes: 0})">Clear X</button>
                    </div>
                </div>

                <div class="admin-box">
                    <h3 style="color:var(--neon-pink); margin:0;">3. Management</h3>
                    <div class="btn-grid">
                        <button class="admin-btn undo-btn" onclick="window.undoLastAction()">↩️ Undo Last</button>
                        <button class="admin-btn danger" onclick="window.clearAllBanners()">Dismiss Banner</button>
                    </div>
                    <div class="btn-grid">
                        <button class="admin-btn" onclick="window.changeRound(1)">Next Round >></button>
                        <button class="admin-btn" onclick="window.changeRound(-1)"><< Prev</button>
                        <button class="admin-btn danger" style="background: rgba(255,0,0,0.1)" onclick="window.cloudUpdate({gameOverTime: Date.now()})">🏁 End Game</button>
                    </div>
                </div>

                <div class="admin-box">
                    <h3 style="color:var(--neon-cyan); margin:0;">4. Reveal Answers</h3>
                    <div id="admin-q-display"></div>
                    <div id="admin-ans-list"></div>
                </div>
            </div>
        </div>

        <!-- HUD (Monitor Only) -->
        <div class="bottom-hud">
            <div class="score-side" id="h-side-1">
                <div class="score-num" id="s1-txt" style="color: var(--neon-cyan);">0</div>
                <div class="score-name" id="n1-txt">LIGHT SQUAD</div>
            </div>
            <div class="score-side" style="text-align: right;" id="h-side-2">
                <div class="score-num" id="s2-txt" style="color: var(--neon-pink);">0</div>
                <div class="score-name" id="n2-txt">STAR SQUAD</div>
            </div>
        </div>
    </div>

    <div id="strike-pop"><div class="pop-x">X</div></div>
    <div id="alert-steal">STEAL OPPORTUNITY!</div>
    <div id="alert-win">TEAM WINS ROUND!</div>
    <div id="alert-switch">SWITCH PLAY!</div>
    <div id="game-over-pop">GAME OVER</div>

    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, doc, onSnapshot, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

        const firebaseConfig = JSON.parse(__firebase_config);
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'exodus-feud-final-v10';

        const gameData = [
            { level: "Round 1", question: "Name an Egyptian god that Jehovah discredited through the 10 plagues.", answers: [{ text: "Hapi (Nile)", points: 40 }, { text: "Heqet (Frog)", points: 30 }, { text: "Amun-Ra (Sun)", points: 20 }, { text: "Apis / Hathor", points: 10 }] },
            { level: "Round 2", question: "Name a specific instruction or symbol of the Passover.", answers: [{ text: "Lamb without blemish", points: 40 }, { text: "Blood on doorposts", points: 30 }, { text: "Unleavened bread", points: 20 }, { text: "Bitter herbs", points: 10 }] },
            { level: "Round 3", question: "Name a behavior that shows a 'hard heart' like Pharaoh.", answers: [{ text: "Using unkind words", points: 40 }, { text: "Unwilling to share", points: 30 }, { text: "Refusing to forgive", points: 20 }, { text: "Not listening to God", points: 10 }] },
            { level: "Round 4", question: "What did the blood of the Passover lamb save Israel from?", answers: [{ text: "The tenth plague", points: 40 }, { text: "The destroyer", points: 30 }, { text: "Physical bondage", points: 20 }, { text: "Bondage of sin", points: 10 }] },
            { level: "Round 5", question: "Name a plague sent to show there is 'none like Him'.", answers: [{ text: "Water to blood", points: 30 }, { text: "Frogs", points: 25 }, { text: "3 Days Darkness", points: 20 }, { text: "Firstborn death", points: 15 }, { text: "Swarm Influx", points: 10 }] },
            { level: "Round 6", question: "What object teaches hard heart vs soft heart?", answers: [{ text: "A rock (hard)", points: 40 }, { text: "A sponge (soft)", points: 30 }, { text: "Water (Word)", points: 20 }] },
            { level: "Round 7", question: "Who does the unblemished Passover lamb symbolize?", answers: [{ text: "Jesus Christ", points: 40 }, { text: "The Savior", points: 30 }, { text: "The Firstborn", points: 20 }, { text: "The Lamb of God", points: 10 }] },
            { level: "Round 8", question: "What modern ordinance remembers our deliverance?", answers: [{ text: "The Sacrament", points: 50 }, { text: "Bread and water", points: 30 }, { text: "Sacrament prayers", points: 20 }] },
            { level: "Round 9", question: "What was a main reason for the 10 plagues?", answers: [{ text: "Show none like Him", points: 40 }, { text: "Free Israelites", points: 30 }, { text: "Immense power", points: 20 }, { text: "Discredit false gods", points: 10 }] },
            { level: "Round 10", question: "What is the meaning behind Passover foods?", answers: [{ text: "Bitter herbs=Sin", points: 40 }, { text: "Unleavened=Leaving", points: 30 }, { text: "Haste=Urgency", points: 20 }] }
        ];

        let sharedState = { currentRound: 0, t1Score: 0, t2Score: 0, strikes: 0, revealed: [], strikeTime: 0, winTime: 0, winningTeamId: 0, activeTeam: 0, originalTeamId: 0, t1Name: "LIGHT SQUAD", t2Name: "STAR SQUAD", gameOverTime: 0, consecutiveWins: 0, lastWinnerId: 0, switchPlayTime: 0, lastWinWasFaceOff: false, monitorScale: 1.0, prevState: null };
        let lastStrike = 0, lastWin = 0, lastRevCount = 0, lastGameOver = 0, lastSwitch = 0, autoAdvanceTimeout = null, user = null, resetConfirming = false;

        async function init() {
            const initAuth = async () => {
              if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await signInWithCustomToken(auth, __initial_auth_token);
              } else {
                await signInAnonymously(auth);
              }
            };
            await initAuth();

            onAuthStateChanged(auth, (u) => {
                user = u; if (!user) return;
                const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'feudSession', 'state');
                onSnapshot(docRef, (snap) => {
                    if (snap.exists()) { sharedState = snap.data(); syncUI(); }
                    else { setDoc(docRef, sharedState); }
                }, (error) => console.error("Firestore sync error:", error));
            });
        }

        window.cloudUpdate = (updates) => {
            if (!user) return;
            const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'feudSession', 'state');
            if (!updates.isUndo && !updates.isReset) {
                const history = { ...sharedState }; delete history.prevState; updates.prevState = history;
            }
            delete updates.isUndo; delete updates.isReset;
            updateDoc(docRef, updates).catch(e => console.error("Update error:", e));
        };

        function syncUI() {
            const data = gameData[sharedState.currentRound]; if (!data) return;
            const isMon = document.body.classList.contains('mode-contestant');
            
            // Set scale factor for Monitor logic
            document.documentElement.style.setProperty('--monitor-scale', sharedState.monitorScale || 1.0);

            // Hide/Show Banners based on timestamps
            if (sharedState.winTime === 0) { document.getElementById('alert-win').style.display = 'none'; document.getElementById('alert-steal').style.display = 'none'; lastWin = 0; }
            if (sharedState.switchPlayTime === 0) { document.getElementById('alert-switch').style.display = 'none'; lastSwitch = 0; }
            if (sharedState.gameOverTime === 0) { document.getElementById('game-over-pop').style.display = 'none'; lastGameOver = 0; }
            if (sharedState.strikeTime === 0) { document.getElementById('strike-pop').style.display = 'none'; lastStrike = 0; }

            // TV Text
            document.getElementById('q-txt').innerText = data.question;
            document.getElementById('round-label').innerText = data.level;
            document.getElementById('s1-txt').innerText = sharedState.t1Score || 0;
            document.getElementById('s2-txt').innerText = sharedState.t2Score || 0;
            document.getElementById('n1-txt').innerText = sharedState.t1Name;
            document.getElementById('n2-txt').innerText = sharedState.t2Name;

            const isFO = sharedState.activeTeam === 0;
            document.getElementById('tv-fo-icon').style.display = isFO ? 'inline-block' : 'none';
            document.getElementById('tv-fo-icon-2').style.display = isFO ? 'inline-block' : 'none';
            document.getElementById('h-side-1').className = sharedState.activeTeam === 1 ? 'score-side active-glow' : 'score-side';
            document.getElementById('h-side-2').className = sharedState.activeTeam === 2 ? 'score-side active-glow' : 'score-side';

            const board = document.getElementById('game-board'); board.innerHTML = '';
            const revList = sharedState.revealed || [];
            data.answers.forEach((ans, i) => {
                const isRevealed = revList.includes(i);
                const slot = document.createElement('div'); slot.className = `answer-slot ${isRevealed ? 'revealed' : ''}`;
                slot.innerHTML = `<div class="front">${i + 1}</div><div class="back"><span>${ans.text}</span><span class="pts-badge">${ans.points}</span></div>`;
                board.appendChild(slot);
            });

            for(let i=1; i<=3; i++) { document.getElementById(`sx-${i}`).className = (sharedState.strikes || 0) >= i ? 'strike-x active' : 'strike-x'; }

            // Admin Panel Sync
            document.getElementById('in-n1').value = sharedState.t1Name || "";
            document.getElementById('in-n2').value = sharedState.t2Name || "";
            document.getElementById('h-t1').className = sharedState.activeTeam === 1 ? 'admin-btn selected' : 'admin-btn';
            document.getElementById('h-t2').className = sharedState.activeTeam === 2 ? 'admin-btn selected' : 'admin-btn';
            document.getElementById('h-fo').className = isFO ? 'admin-btn selected' : 'admin-btn';
            document.getElementById('steal-status').style.display = (sharedState.strikes || 0) >= 3 ? 'block' : 'none';
            document.getElementById('admin-q-display').innerText = data.question;
            document.getElementById('res-slider').value = sharedState.monitorScale || 1.0;

            const adminList = document.getElementById('admin-ans-list'); adminList.innerHTML = '';
            data.answers.forEach((ans, i) => {
                const isItemRev = revList.includes(i);
                const card = document.createElement('div'); card.className = 'admin-ans-card';
                card.innerHTML = `<div><strong>${ans.text}</strong> (${ans.points})</div><button onclick="window.revealIdx(${i})" ${isItemRev ? 'disabled' : ''}>REVEAL</button>`;
                adminList.appendChild(card);
            });

            // SFX & VFX (Monitor only)
            if (sharedState.strikeTime > lastStrike && sharedState.strikeTime !== 0) { lastStrike = sharedState.strikeTime; if(isMon) doStrikeAnim(); }
            if (sharedState.winTime > lastWin && sharedState.winTime !== 0) { lastWin = sharedState.winTime; if(isMon) doWinAnim(sharedState.winningTeamId); }
            if (sharedState.switchPlayTime > lastSwitch && sharedState.switchPlayTime !== 0) { lastSwitch = sharedState.switchPlayTime; if(isMon) doSwitchAnim(); }
            if (revList.length > lastRevCount) { lastRevCount = revList.length; if(isMon && sharedState.winTime <= lastWin) playHappyReveal(); }
            if (sharedState.gameOverTime > lastGameOver && sharedState.gameOverTime !== 0) { lastGameOver = sharedState.gameOverTime; if(isMon) doGameOver(); }
        }

        window.startApp = () => { initAudio(); document.getElementById('audio-unlock').style.display = 'none'; };

        window.revealIdx = (idx) => {
            const revList = sharedState.revealed || []; if (revList.includes(idx)) return;
            const pts = gameData[sharedState.currentRound].answers[idx].points;
            let up = { revealed: [...revList, idx] }; const team = sharedState.activeTeam;
            if (team !== 0) {
                if (sharedState.strikes >= 3 || up.revealed.length === gameData[sharedState.currentRound].answers.length) {
                    up.winTime = Date.now(); up.winningTeamId = team; up.strikes = 0; up.lastWinWasFaceOff = false;
                    if (team === 1) up.t1Score = (sharedState.t1Score || 0) + pts; else up.t2Score = (sharedState.t2Score || 0) + pts;
                    if (document.body.classList.contains('mode-admin')) scheduleAutoAdvance();
                } else {
                    if (team === 1) up.t1Score = (sharedState.t1Score || 0) + pts; else up.t2Score = (sharedState.t2Score || 0) + pts;
                }
            }
            window.cloudUpdate(up);
        };

        window.sendStrike = () => {
            let cur = (sharedState.strikes || 0); let up = { strikeTime: Date.now() };
            if (cur < 3) { up.strikes = cur + 1; if (up.strikes === 3 && sharedState.activeTeam !== 0) up.activeTeam = (sharedState.activeTeam === 1) ? 2 : 1; }
            else { up.winTime = Date.now(); up.winningTeamId = sharedState.originalTeamId; up.strikes = 0; up.lastWinWasFaceOff = false; if (document.body.classList.contains('mode-admin')) scheduleAutoAdvance(); }
            window.cloudUpdate(up);
        };

        window.handleManualWin = (tid) => { window.cloudUpdate({winTime: Date.now(), winningTeamId: tid, strikes: 0, lastWinWasFaceOff: (sharedState.activeTeam === 0)}); if (document.body.classList.contains('mode-admin')) scheduleAutoAdvance(); };
        window.clearAllBanners = () => { if (autoAdvanceTimeout) clearTimeout(autoAdvanceTimeout); window.cloudUpdate({ winTime: 0, strikeTime: 0, gameOverTime: 0, strikes: 0, switchPlayTime: 0 }); };
        function scheduleAutoAdvance() { if (autoAdvanceTimeout) clearTimeout(autoAdvanceTimeout); autoAdvanceTimeout = setTimeout(() => { window.changeRound(1); autoAdvanceTimeout = null; }, 6000); }
        window.undoLastAction = () => { if (sharedState.prevState) window.cloudUpdate({ ...sharedState.prevState, isUndo: true }); };
        window.adjustScore = (t, a) => { if (t === 1) window.cloudUpdate({ t1Score: (sharedState.t1Score || 0) + a }); else window.cloudUpdate({ t2Score: (sharedState.t2Score || 0) + a }); };

        function doStrikeAnim() { const o = document.getElementById('strike-pop'); o.style.display = 'flex'; playBuzzer(); setTimeout(() => { o.style.display = 'none'; if (sharedState.strikes === 3) { const a = document.getElementById('alert-steal'); a.style.display = 'block'; setTimeout(() => a.style.display = 'none', 3000); } }, 1200); }
        function doWinAnim(tid) { if (!tid) return; const n = tid === 1 ? sharedState.t1Name : sharedState.t2Name; const b = document.getElementById('alert-win'); b.innerText = `${n} WINS ROUND!`; b.style.display = 'block'; playWinSfx(); setTimeout(() => b.style.display = 'none', 5000); }
        function doSwitchAnim() { const b = document.getElementById('alert-switch'); b.style.display = 'block'; playHappyReveal(); setTimeout(() => b.style.display = 'none', 3000); }
        function doGameOver() { const b = document.getElementById('game-over-pop'); let r = (sharedState.t1Score > sharedState.t2Score) ? `${sharedState.t1Name}<br>CHAMPION!` : (sharedState.t2Score > sharedState.t1Score ? `${sharedState.t2Name}<br>CHAMPION!` : "TIE GAME!"); b.innerHTML = `GAME OVER<br><br><span style="color:var(--warning-gold)">${r}</span>`; b.style.display = 'block'; playWinSfx(); }

        window.changeRound = (dir) => {
            if (autoAdvanceTimeout) clearTimeout(autoAdvanceTimeout);
            const next = Math.max(0, Math.min(gameData.length - 1, (sharedState.currentRound || 0) + dir));
            const winner = sharedState.winningTeamId; let nextActive = winner || 0; let streak = sharedState.consecutiveWins || 0; let lastId = sharedState.lastWinnerId || 0; let sw = false;
            if (winner !== 0 && !sharedState.lastWinWasFaceOff) { if (winner === lastId) streak++; else { streak = 1; lastId = winner; } if (streak >= 2) { sw = true; nextActive = (winner === 1) ? 2 : 1; streak = 0; lastId = 0; } }
            else if (winner !== 0) nextActive = winner;
            window.cloudUpdate({ currentRound: next, revealed: [], strikes: 0, activeTeam: nextActive, originalTeamId: nextActive, gameOverTime: 0, winningTeamId: 0, winTime: 0, strikeTime: 0, lastWinnerId: lastId, consecutiveWins: streak, switchPlayTime: sw ? Date.now() : 0, lastWinWasFaceOff: false });
        };

        window.toggleSwitcher = () => document.getElementById('main-switcher').classList.toggle('visible');
        window.setView = (m) => { document.body.className = `mode-${m}`; document.getElementById('btn-con').classList.toggle('active', m === 'contestant'); document.getElementById('btn-adm').classList.toggle('active', m === 'admin'); toggleSwitcher(); };
        window.handleResetClick = () => { const b = document.getElementById('reset-button'); if (!resetConfirming) { resetConfirming = true; b.innerText = "TAP TO CONFIRM"; b.classList.add('reset-confirming'); setTimeout(() => { resetConfirming = false; b.innerText = "⚠️ Full Game Reset"; b.classList.remove('reset-confirming'); }, 4000); } else { window.resetGame(); resetConfirming = false; b.innerText = "⚠️ Full Game Reset"; b.classList.remove('reset-confirming'); toggleSwitcher(); } };
        window.resetGame = () => { if (autoAdvanceTimeout) clearTimeout(autoAdvanceTimeout); setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'feudSession', 'state'), { currentRound: 0, t1Score: 0, t2Score: 0, strikes: 0, revealed: [], strikeTime: 0, winTime: 0, winningTeamId: 0, activeTeam: 0, originalTeamId: 0, t1Name: "LIGHT SQUAD", t2Name: "STAR SQUAD", gameOverTime: 0, prevState: null, consecutiveWins: 0, lastWinnerId: 0, switchPlayTime: 0, lastWinWasFaceOff: false, monitorScale: 1.0 }); lastStrike = lastWin = lastGameOver = lastRevCount = lastSwitch = 0; };
        
        let audioCtx = null;
        function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
        function playHappyReveal() { if (!audioCtx) return; const now = audioCtx.currentTime; const notes = [880, 1108, 1318]; notes.forEach((f, i) => { const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f, now + (i * 0.08)); g.gain.setValueAtTime(0, now + (i * 0.08)); g.gain.linearRampToValueAtTime(0.2, now + (i * 0.08) + 0.02); g.gain.linearRampToValueAtTime(0, now + (i * 0.08) + 0.15); o.connect(g); g.connect(audioCtx.destination); o.start(now + (i * 0.08)); o.stop(now + (i * 0.08) + 0.15); }); }
        function playBuzzer() { if (!audioCtx) return; const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(110, audioCtx.currentTime); o.frequency.linearRampToValueAtTime(40, audioCtx.currentTime + 0.5); g.gain.setValueAtTime(0.5, audioCtx.currentTime); g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5); o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + 0.5); }
        function playWinSfx() { if (!audioCtx) return; [523, 659, 784, 1046, 1318].forEach((f, i) => { const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.frequency.value = f; g.gain.setValueAtTime(0, audioCtx.currentTime + i * 0.1); g.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + i * 0.1 + 0.05); g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + i * 0.1 + 0.3); o.connect(g); g.connect(audioCtx.destination); o.start(audioCtx.currentTime + i * 0.1); o.stop(audioCtx.currentTime + i * 0.1 + 0.4); }); }
        window.onload = init;
    </script>
</body>
</html>