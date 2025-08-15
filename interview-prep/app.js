(function() {
	'use strict';

	const $ = (sel, root = document) => root.querySelector(sel);
	const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

	/* Util */
	const storage = {
		get(key, fallback) {
			try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
		},
		set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
	};

	const nowSec = () => Math.floor(Date.now() / 1000);

	/* Nav toggle for mobile */
	const navToggle = $('.nav-toggle');
	const navLinks = $('.nav-links');
	if (navToggle && navLinks) {
		navToggle.addEventListener('click', () => {
			const open = navLinks.style.display === 'flex';
			navLinks.style.display = open ? 'none' : 'flex';
			navToggle.setAttribute('aria-expanded', String(!open));
		});
		$$('.nav-links a').forEach(a => a.addEventListener('click', () => {
			navLinks.style.display = 'none';
			navToggle.setAttribute('aria-expanded', 'false');
		}));
	}

	/* Hero year */
	const yearEl = $('#year');
	if (yearEl) yearEl.textContent = new Date().getFullYear();

	/* Company cards let default anchors navigate; keep optional stub on middle-click */
	$$('.company-card').forEach(card => {
		card.addEventListener('auxclick', (e) => {
			if (e.button === 1) {
				const company = card.getAttribute('data-company');
				console.log(`Opening ${company} prep in new tab`);
			}
		});
	});

	/* Mock Interview - simple AI text Q&A stub */
	const aiBtn = $('#start-ai-interview');
	if (aiBtn) {
		aiBtn.addEventListener('click', () => {
			const sampleQuestions = [
				"Tell me about yourself.",
				"Explain OOP principles.",
				"What is normalization in DBMS?",
				"How does TCP differ from UDP?",
				"Solve: Find two-sum in an array."
			];
			const q = sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)];
			const answer = prompt(q + "\n\nType your answer (1-3 mins recommended).");
			if (answer && answer.length > 20) {
				alert("Feedback: Clear structure detected. Consider adding examples and metrics. Score: 7.5/10");
				awardBadge('First Mock Attempt');
				incrementLeaderboard('You');
			} else if (answer) {
				alert("Feedback: Answers should be specific and structured. Score: 5/10");
			} else {
				alert("No answer submitted.");
			}
		});
	}

	/* Exam Simulation */
	const examBtn = $('#start-exam');
	const timerEl = $('#exam-timer');
	const viewport = $('#exam-viewport');
	const durationSel = $('#exam-duration');
	let examEndTs = null; let tickId = null;

	function renderExamQuestion() {
		const questions = [
			{ t: 'Aptitude', q: 'If 3x + 5 = 20, what is x?', a: ['3', '5', '15', '25'], c: 0 },
			{ t: 'Reasoning', q: 'Find the next number: 2, 6, 12, 20, ?', a: ['28', '30', '32', '36'], c: 0 },
			{ t: 'English', q: 'Choose the correct sentence.', a: ['He don’t like it.', 'He doesn’t like it.', 'He not like it.', 'He didn’t likes it.'], c: 1 },
			{ t: 'Coding', q: 'Time complexity of binary search?', a: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], c: 1 },
		];
		const { t, q, a } = questions[Math.floor(Math.random() * questions.length)];
		if (!viewport) return;
		viewport.innerHTML = '';
		const wrap = document.createElement('div');
		wrap.style.display = 'grid';
		wrap.style.gap = '10px';
		wrap.innerHTML = `<div style="font-weight:700;color:#0b365d">${t}</div><div>${q}</div>`;
		a.forEach((opt) => {
			const btn = document.createElement('button');
			btn.className = 'btn btn-outline';
			btn.textContent = opt;
			btn.addEventListener('click', () => {
				alert('Answer recorded. New question loaded.');
				renderExamQuestion();
				updateReadiness(+2);
				awardBadge('Quizzer');
				incrementLeaderboard('You');
			});
			wrap.appendChild(btn);
		});
		viewport.appendChild(wrap);
	}

	function startTimer(mins) {
		examEndTs = nowSec() + mins * 60;
		if (tickId) clearInterval(tickId);
		tickId = setInterval(updateTimer, 1000);
		updateTimer();
		renderExamQuestion();
	}
	function updateTimer() {
		if (!timerEl) return;
		const remain = Math.max(0, examEndTs - nowSec());
		const m = String(Math.floor(remain / 60)).padStart(2, '0');
		const s = String(remain % 60).padStart(2, '0');
		timerEl.textContent = `${m}:${s}`;
		if (remain <= 0) {
			clearInterval(tickId);
			if (viewport) {
				viewport.textContent = 'Time up! Submitting...';
				setTimeout(() => viewport.textContent = 'Score: 72% (demo). Review answers in Dashboard.', 800);
			}
			awardBadge('Finisher');
		}
	}
	if (examBtn) {
		examBtn.addEventListener('click', () => startTimer(parseInt(durationSel.value, 10)));
	}

	/* Skills Hub */
	$$('.skill-card').forEach(btn => {
		btn.addEventListener('click', () => {
			const skill = btn.getAttribute('data-skill');
			const q = prompt(`Start a quick ${skill} drill. Describe how you would solve a sample problem.`);
			if (q) {
				awardBadge(`${skill.toUpperCase()} Starter`);
				updateReadiness(+1);
			}
		});
	});

	/* Roadmap - simple suggestion engine */
	const roadmapEl = $('#roadmap-panel');
	function getReadiness() { return storage.get('readiness', 50); }
	function updateReadiness(delta) {
		const score = Math.max(0, Math.min(100, getReadiness() + delta));
		storage.set('readiness', score);
		plotReadiness();
		renderRoadmap();
	}
	function renderRoadmap() {
		if (!roadmapEl) return;
		const score = getReadiness();
		const suggestions = [];
		if (score < 60) suggestions.push('Focus: Aptitude basics and English grammar drills.');
		if (score >= 60 && score < 75) suggestions.push('Next: Data Structures (arrays, strings) and reasoning puzzles.');
		if (score >= 75) suggestions.push('Advance: Mock interviews twice weekly. Practice system design basics.');
		suggestions.push('Target companies: TCS/Infosys patterns this week.');
		roadmapEl.innerHTML = suggestions.map(s => `<div class="tip">${s}</div>`).join('');
	}

	/* Tracker */
	const trackerForm = $('#tracker-form');
	const trackerList = $('#tracker-list');
	function renderTracker() {
		const items = storage.get('tracker', []);
		if (!trackerList) return;
		trackerList.innerHTML = '';
		items.forEach((it, idx) => {
			const li = document.createElement('li');
			li.innerHTML = `
				<div>${it.company}</div>
				<div class="status ${it.result}">${it.result}</div>
				<div>${it.notes || ''}</div>
				<button class="btn btn-outline" data-idx="${idx}">Remove</button>
			`;
			li.querySelector('button').addEventListener('click', () => {
				const items2 = storage.get('tracker', []);
				items2.splice(idx, 1);
				storage.set('tracker', items2);
				renderTracker();
			});
			trackerList.appendChild(li);
		});
	}
	if (trackerForm) {
		trackerForm.addEventListener('submit', (e) => {
			e.preventDefault();
			const company = $('#company').value.trim();
			const result = $('#result').value;
			const notes = $('#notes').value.trim();
			if (!company) return;
			const items = storage.get('tracker', []);
			items.push({ company, result, notes, at: Date.now() });
			storage.set('tracker', items);
			renderTracker();
			awardBadge('Diligent Logger');
		});
	}

	/* Resume */
	const genBtn = $('#generate-resume');
	if (genBtn) {
		genBtn.addEventListener('click', () => {
			const name = $('#name').value.trim();
			if (!name) { alert('Please fill your name.'); return; }
			window.print();
		});
	}

	/* Gamification */
	const badgeShelf = $('#badge-shelf');
	const leaderboard = $('#leaderboard');
	const streakCountEl = $('#streak-count');
	const streakBtn = $('#streak-checkin');
	const streakStatusEl = $('#streak-status');

	function awardBadge(title) {
		const badges = storage.get('badges', []);
		if (!badges.includes(title)) {
			badges.push(title);
			storage.set('badges', badges);
			renderBadges();
		}
	}
	function renderBadges() {
		if (!badgeShelf) return;
		const badges = storage.get('badges', []);
		badgeShelf.innerHTML = badges.map(b => `<span class="badge">${b}</span>`).join('');
	}
	function incrementLeaderboard(user) {
		const board = storage.get('leaderboard', {});
		board[user] = (board[user] || 0) + 10;
		storage.set('leaderboard', board);
		renderLeaderboard();
	}
	function renderLeaderboard() {
		if (!leaderboard) return;
		const board = storage.get('leaderboard', {});
		const sorted = Object.entries(board).sort((a,b) => b[1]-a[1]).slice(0, 10);
		leaderboard.innerHTML = sorted.map(([u, s]) => `<li><strong>${u}</strong> — ${s} pts</li>`).join('');
	}

	// Daily Streak
	function getLocalDateStr(ts = Date.now()) {
		return new Date(ts).toISOString().slice(0,10);
	}
	function loadStreak() {
		return storage.get('streak', { last: null, count: 0 });
	}
	function saveStreak(s) { storage.set('streak', s); }
	function renderStreak() {
		const s = loadStreak();
		if (streakCountEl) streakCountEl.textContent = s.count;
	}
	function checkinToday() {
		const today = getLocalDateStr();
		const s = loadStreak();
		if (s.last === today) {
			if (streakStatusEl) streakStatusEl.textContent = 'Already checked in today.';
			return;
		}
		const yesterday = getLocalDateStr(Date.now() - 24*60*60*1000);
		if (s.last === yesterday) s.count += 1; else s.count = 1;
		s.last = today;
		saveStreak(s);
		renderStreak();
		if (streakStatusEl) streakStatusEl.textContent = 'Great! Keep it up!';
		incrementLeaderboard('You');
		if (s.count === 3) awardBadge('3-Day Streak');
		if (s.count === 7) awardBadge('7-Day Streak');
	}
	if (streakBtn) streakBtn.addEventListener('click', checkinToday);

	/* Chart - simple canvas line */
	const chart = $('#readiness-chart');
	function plotReadiness() {
		if (!chart) return;
		const ctx = chart.getContext('2d');
		const history = storage.get('readinessHistory', []);
		const score = getReadiness();
		history.push({ t: Date.now(), s: score });
		if (history.length > 30) history.shift();
		storage.set('readinessHistory', history);

		ctx.clearRect(0,0,chart.width, chart.height);
		// axes
		ctx.strokeStyle = '#cfe0ff';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(40, 10);
		ctx.lineTo(40, 220);
		ctx.lineTo(580, 220);
		ctx.stroke();

		if (history.length < 2) return;
		const xs = history.map((_, i) => 40 + (i * (540 / (history.length - 1))));
		const ys = history.map(h => 220 - (h.s / 100) * 200);
		ctx.strokeStyle = '#2563eb';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(xs[0], ys[0]);
		for (let i = 1; i < xs.length; i++) {
			ctx.lineTo(xs[i], ys[i]);
		}
		ctx.stroke();
		ctx.fillStyle = '#2563eb';
		xs.forEach((x, i) => {
			ctx.beginPath(); ctx.arc(x, ys[i], 3, 0, Math.PI*2); ctx.fill();
		});
	}

	// Initial render
	renderTracker();
	renderBadges();
	renderLeaderboard();
	renderRoadmap();
	renderStreak();
	plotReadiness();
})();