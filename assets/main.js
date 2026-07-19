/* agmk showcase — interactions
   copy buttons · scroll reveal · terminal typing · motion prefs */
(() => {
	"use strict";

	const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	/* ---------- Reduced motion: freeze SMIL animations too ---------- */
	if (reducedMotion) {
		document.querySelectorAll("svg").forEach((svg) => {
			if (typeof svg.pauseAnimations === "function") svg.pauseAnimations();
		});
	}

	/* ---------- Copy-to-clipboard buttons ---------- */
	document.querySelectorAll(".copy-btn").forEach((btn) => {
		btn.addEventListener("click", async () => {
			const text = btn.getAttribute("data-copy") || "";
			try {
				await navigator.clipboard.writeText(text);
			} catch {
				// Fallback for non-secure contexts
				const ta = document.createElement("textarea");
				ta.value = text;
				ta.style.position = "fixed";
				ta.style.opacity = "0";
				document.body.appendChild(ta);
				ta.select();
				document.execCommand("copy");
				ta.remove();
			}
			btn.classList.add("copied");
			setTimeout(() => btn.classList.remove("copied"), 1600);
		});
	});

	/* ---------- Scroll reveal ---------- */
	if ("IntersectionObserver" in window && !reducedMotion) {
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting) {
						e.target.classList.add("visible");
						io.unobserve(e.target);
					}
				}
			},
			{ threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
		);
		document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
	} else {
		document.documentElement.classList.add("no-observer");
	}

	/* ---------- Card hover glow follows the pointer ---------- */
	document.querySelectorAll(".card").forEach((card) => {
		card.addEventListener("pointermove", (ev) => {
			const r = card.getBoundingClientRect();
			card.style.setProperty("--mx", `${ev.clientX - r.left}px`);
			card.style.setProperty("--my", `${ev.clientY - r.top}px`);
		});
	});

	/* ---------- Terminal typing animation ---------- */
	const term = document.getElementById("term");
	if (term && !reducedMotion && "IntersectionObserver" in window) {
		const lines = Array.from(term.querySelectorAll(".tline"));

		// Snapshot the text of each command span so we can retype it
		const cmdSpans = new Map();
		for (const line of lines) {
			if (line.dataset.type === "cmd") {
				const span = line.querySelector(".tc");
				if (span) cmdSpans.set(line, span.textContent);
			}
		}

		const typeLine = (line) =>
			new Promise((resolve) => {
				line.classList.add("shown");
				if (line.dataset.type !== "cmd" || !cmdSpans.has(line)) {
					resolve();
					return;
				}
				const span = line.querySelector(".tc");
				const full = cmdSpans.get(line);
				span.textContent = "";
				line.classList.add("typing");
				let i = 0;
				const tick = () => {
					i += 1;
					span.textContent = full.slice(0, i);
					if (i < full.length) {
						setTimeout(tick, 22 + Math.random() * 40);
					} else {
						line.classList.remove("typing");
						resolve();
					}
				};
				setTimeout(tick, 120);
			});

		const play = async () => {
			for (const line of lines) {
				await typeLine(line);
				await new Promise((r) => setTimeout(r, line.dataset.type === "cmd" ? 160 : 420));
			}
		};

		const io = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) {
					io.disconnect();
					play();
				}
			},
			{ threshold: 0.35 }
		);

		term.classList.add("term-animate");
		io.observe(term);
	}
})();
