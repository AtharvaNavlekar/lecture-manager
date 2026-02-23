import { useEffect, useRef, useCallback } from 'react';
import '../styles/ownership.css';

const currentYear = new Date().getFullYear();

/* ─── SVG Icon helpers (inline, no deps) ────────────────────────── */
const IconGlobe = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
);

const IconLinkedIn = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
    </svg>
);

const IconGitHub = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
);

const IconMail = ({ size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m2 7 10 7 10-7" />
    </svg>
);

const IconArrowUpRight = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 17L17 7M17 7H7M17 7v10" />
    </svg>
);

const IconCode = ({ size = 28 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={size > 20 ? '1.2' : '2'} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
);

const IconLayers = ({ size = 28 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={size > 20 ? '1.2' : '2'} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
    </svg>
);

const IconFile = ({ size = 28 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={size > 20 ? '1.2' : '2'} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
);

const IconLock = ({ size = 28 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={size > 20 ? '1.2' : '2'} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const IconShield = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const IconLayout = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
    </svg>
);

const IconFileText = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
);

const IconAlertCircle = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
    </svg>
);

const IconEdit = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
);

const IconBolt = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
);

const IconGear = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

const IconPlay = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 3l14 9-14 9V3z" />
    </svg>
);

const IconMonitor = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
    </svg>
);

const IconDatabase = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
);

const IconUser = () => (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
);

/* ─── Marquee items ──────────────────────────────────────────────── */
const marqueeItems = [
    { text: 'THE.NAVLEKAR', lit: true },
    { text: 'LECTURE MANAGER', lit: false },
    { text: 'INTELLECTUAL PROPERTY', lit: true },
    { text: 'FULL STACK DEVELOPER', lit: false },
    { text: 'SOLE PROPRIETOR', lit: true },
    { text: 'MERN STACK', lit: false },
    { text: 'REACT 19 + VITE 7', lit: true },
    { text: 'BUSINESS ANALYST', lit: false },
];

/* ─── Tech stack data ────────────────────────────────────────────── */
const techStack = [
    { num: '01', name: 'React 19', cat: 'Frontend Framework', tag: 'Core', tagClass: 'tag-core', Icon: IconCode },
    { num: '02', name: 'Vite 7', cat: 'Build Tool', tag: 'Core', tagClass: 'tag-core', Icon: IconBolt },
    { num: '03', name: 'TailwindCSS 4', cat: 'Styling System', tag: 'Design', tagClass: 'tag-design', Icon: IconGear },
    { num: '04', name: 'Framer Motion', cat: 'Animation Engine', tag: 'Design', tagClass: 'tag-design', Icon: IconPlay },
    { num: '05', name: 'Node.js + Express', cat: 'Backend Runtime', tag: 'Backend', tagClass: 'tag-backend', Icon: IconMonitor },
    { num: '06', name: 'MongoDB', cat: 'Database Layer', tag: 'Backend', tagClass: 'tag-backend', Icon: IconDatabase },
];

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
const Ownership = () => {
    const progressRef = useRef(null);
    const pageRef = useRef(null);

    /* Scroll progress bar */
    const handleScroll = useCallback(() => {
        if (!progressRef.current) return;
        const pct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        progressRef.current.style.width = `${pct}%`;
    }, []);

    /* Scroll reveal observer */
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        e.target.classList.add('visible');
                        observer.unobserve(e.target);
                    }
                });
            },
            { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
        );

        const page = pageRef.current;
        if (page) {
            page.querySelectorAll('.reveal, .reveal-left').forEach((el) => observer.observe(el));
        }

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', handleScroll);
        };
    }, [handleScroll]);

    const scrollToTop = (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="ownership-page" ref={pageRef}>
            {/* Progress bar */}
            <div className="o-progress" ref={progressRef} aria-hidden="true" />

            {/* ═══ NAV ═══ */}
            <nav className="o-nav" aria-label="Site navigation">
                <a href="#" className="nav-logo" onClick={scrollToTop}>
                    THE<span className="dot">.</span>NAVLEKAR
                </a>
                <div className="nav-links">
                    <a href="https://thenavlekar.netlify.app/" target="_blank" rel="noopener noreferrer">
                        <IconGlobe /> Portfolio
                    </a>
                    <a href="https://www.linkedin.com/in/atharvanavlekar/" target="_blank" rel="noopener noreferrer">
                        <IconLinkedIn /> LinkedIn
                    </a>
                    <a href="https://github.com/atharvanavlekar" target="_blank" rel="noopener noreferrer">
                        <IconGitHub /> GitHub
                    </a>
                </div>
                <div className="nav-status">
                    <span className="pulse" aria-hidden="true" />
                    IP Declaration
                </div>
            </nav>

            {/* ═══ HERO ═══ */}
            <section className="hero" aria-label="Page introduction">
                <div className="hero-eyebrow">
                    <span className="pulse" aria-hidden="true" />
                    Official · Intellectual Property
                </div>

                <h1 className="hero-title" aria-label="Ownership and Rights Declared">
                    <span className="hero-title-wrap"><span className="hero-title-line">OWNERSHIP</span></span>
                    <span className="hero-title-wrap"><span className="hero-title-line">&amp; RIGHTS</span></span>
                    <span className="hero-title-wrap"><span className="hero-title-line">DECLARED.</span></span>
                </h1>

                <div className="hero-bottom">
                    <p className="hero-desc">
                        A definitive declaration of intellectual property, sole ownership, and the engineering vision
                        behind the <strong>Lecture Manager</strong> ecosystem — 45 pages, built entirely by one architect.
                    </p>
                    <div className="hero-actions">
                        <a href="mailto:thenavlekar@gmail.com" className="btn btn-fill">
                            <IconMail /> Get in Touch
                        </a>
                        <a href="https://thenavlekar.netlify.app/" target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                            Portfolio <IconArrowUpRight />
                        </a>
                    </div>
                </div>
            </section>

            {/* ═══ MARQUEE ═══ */}
            <div className="marquee-wrap" aria-hidden="true">
                <div className="marquee-track">
                    {/* doubled for seamless loop */}
                    {[...marqueeItems, ...marqueeItems].map((item, i) => (
                        <div key={i} className={`marquee-item${item.lit ? ' lit' : ''}`}>
                            {item.text} <span className="marquee-sep">///</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ═══ IDENTITY ═══ */}
            <section className="identity-section" aria-labelledby="identity-title">
                <div className="identity-photo-col reveal-left">
                    <div className="section-eyebrow">Identity Record</div>
                    <div className="photo-frame">
                        <img
                            src="/Profile Photo.png"
                            alt="Atharva Navlekar — Full Stack Developer"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
                        />
                        <div className="photo-frame-placeholder" style={{ display: 'none' }} aria-hidden="true">
                            <IconUser />
                        </div>
                    </div>
                    <div className="photo-caption">Atharva Navlekar · Mumbai, India · {currentYear}</div>
                </div>

                <div className="identity-info-col reveal">
                    <div>
                        <div className="section-eyebrow" id="identity-title">Creator Behind The Platform</div>
                        <div className="big-name">ATHARVA<br /><span className="accent">NAVLEKAR</span></div>
                        <div className="title-role">Full Stack Developer &amp; Business Analyst</div>
                        <div className="id-grid">
                            <div className="id-cell"><div className="id-cell-label">Ownership Status</div><div className="id-cell-value em">Sole Proprietor</div></div>
                            <div className="id-cell"><div className="id-cell-label">Graduation Year</div><div className="id-cell-value">2026</div></div>
                            <div className="id-cell"><div className="id-cell-label">Primary Stack</div><div className="id-cell-value">MERN + Java</div></div>
                            <div className="id-cell"><div className="id-cell-label">Independence</div><div className="id-cell-value em">100%</div></div>
                            <div className="id-cell"><div className="id-cell-label">Location</div><div className="id-cell-value">Mumbai, India</div></div>
                            <div className="id-cell"><div className="id-cell-label">Rights Scope</div><div className="id-cell-value">All IP Owned</div></div>
                        </div>
                    </div>
                    <div className="tag-row">
                        <span className="tag lit">React 19</span>
                        <span className="tag lit">Node.js</span>
                        <span className="tag lit">MongoDB</span>
                        <span className="tag">Express</span>
                        <span className="tag">Vite 7</span>
                        <span className="tag">TailwindCSS 4</span>
                        <span className="tag">Java</span>
                        <span className="tag">MySQL</span>
                    </div>
                </div>
            </section>

            {/* ═══ STATS BAND ═══ */}
            <div className="stats-band" aria-label="Key statistics">
                {[
                    { icon: <IconCode size={28} />, num: '5', unit: '+', label: 'Languages' },
                    { icon: <IconLayers size={28} />, num: '5', unit: '+', label: 'Major Projects' },
                    { icon: <IconFile size={28} />, num: '45', unit: '', label: 'Pages Built' },
                    { icon: <IconLock size={28} />, num: '100', unit: '%', label: 'Independent' },
                ].map((stat, i) => (
                    <div key={i} className="stat-block reveal">
                        <div className="stat-icon" aria-hidden="true">{stat.icon}</div>
                        <div className="stat-num">{stat.num}{stat.unit && <span className="stat-unit">{stat.unit}</span>}</div>
                        <div className="stat-label">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* ═══ DECLARATION ═══ */}
            <section className="declaration-section" aria-labelledby="decl-heading">
                <div className="decl-inner reveal">
                    <div className="decl-tag">01 — OFFICIAL DECLARATION</div>
                    <blockquote className="decl-quote" id="decl-heading">
                        "I, <strong>Atharva Navlekar</strong>, officially declare that I am the sole owner,
                        primary engineer, and exclusive rights holder of this platform and all associated
                        intellectual property."
                    </blockquote>
                    <div className="decl-meta">
                        <div>
                            <div className="decl-name">ATHARVA NAVLEKAR</div>
                            <div className="decl-role">Full Stack Developer &amp; Business Analyst · Mumbai</div>
                        </div>
                        <div className="verified-badge">
                            <span className="pulse" aria-hidden="true" />
                            Verified · {currentYear}
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ LEGAL PROTOCOLS ═══ */}
            <section className="legal-section" aria-labelledby="legal-heading">
                <div className="section-header reveal">
                    <div>
                        <div className="section-eyebrow">Legal Architecture</div>
                        <h2 className="section-title" id="legal-heading">RIGHTS &amp; <span className="em">GOVERNANCE</span></h2>
                    </div>
                    <div className="section-count">06 PROTOCOLS</div>
                </div>

                <div className="cards-grid reveal">
                    {[
                        { num: '01', Icon: IconShield, title: 'Intellectual Copyright', body: 'All source code, UI systems, branding, and written content are protected under intellectual property laws. Unauthorized reproduction is strictly prohibited.' },
                        { num: '02', Icon: IconLayout, title: 'Project Architecture', body: 'Component hierarchies, API structures, and operational logic represent original intellectual work. Engineering choices are proprietary.' },
                        { num: '03', Icon: IconFileText, title: 'Usage Parameters', body: 'Public portfolio for recruiters and peers. Commercial extraction or repurposing of digital assets requires written consent.' },
                        { num: '04', Icon: IconGlobe, title: 'Open Source Compliance', body: 'Libraries (React, Express, Tailwind) used under their respective licenses. The unique assembly remains proprietary configuration.' },
                    ].map((card) => (
                        <div key={card.num} className="protocol-card">
                            <span className="protocol-num">{card.num}</span>
                            <div className="protocol-icon" aria-hidden="true"><card.Icon /></div>
                            <div className="protocol-title">{card.title}</div>
                            <div className="protocol-body">{card.body}</div>
                        </div>
                    ))}
                </div>

                <div className="wide-cards reveal">
                    <div className="wide-card">
                        <div className="wide-card-layout">
                            <div className="wide-card-left">
                                <span className="protocol-num">05</span>
                                <div className="protocol-icon" aria-hidden="true"><IconAlertCircle /></div>
                                <div className="protocol-title">Legal Standing</div>
                            </div>
                            <div className="protocol-body" style={{ fontSize: '13px', lineHeight: 1.85, paddingTop: '2px' }}>
                                All proprietary codebases, design systems, and digital assets under the Lecture Manager ecosystem belong
                                exclusively to Atharva Navlekar. Any IP dispute shall reference this declaration as the primary
                                ownership document. For licensing or collaboration, contact via official channels.
                            </div>
                        </div>
                    </div>
                    <div className="wide-card">
                        <div className="wide-card-layout">
                            <div className="wide-card-left">
                                <span className="protocol-num">06</span>
                                <div className="protocol-icon" aria-hidden="true"><IconEdit /></div>
                                <div className="protocol-title">Design System Rights</div>
                            </div>
                            <div className="protocol-body" style={{ fontSize: '13px', lineHeight: 1.85, paddingTop: '2px' }}>
                                The emerald design system, 45-page component library, animation framework, and UI language of Lecture
                                Manager constitute a unique creative work. Visual reproduction — even partial — without
                                attribution and consent is a direct violation of these declared rights.
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ TECH STACK ═══ */}
            <section className="tech-section" aria-labelledby="tech-heading">
                <div className="section-header reveal">
                    <div>
                        <div className="section-eyebrow">Engineering Stack</div>
                        <h2 className="section-title" id="tech-heading">BUILT WITH <span className="em">PRECISION</span></h2>
                    </div>
                    <div className="section-count">6 TECHNOLOGIES</div>
                </div>
                <div className="reveal">
                    {techStack.map((tech) => (
                        <div key={tech.num} className="stack-row">
                            <div className="stack-num">{tech.num}</div>
                            <div className="stack-icon" aria-hidden="true"><tech.Icon size={16} /></div>
                            <div className="stack-name">{tech.name}</div>
                            <div className="stack-cat">{tech.cat}</div>
                            <div className="stack-tag-cell"><span className={`stack-tag ${tech.tagClass}`}>{tech.tag}</span></div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══ FINE PRINT ═══ */}
            <div className="fine-section reveal">
                <div className="fine-text">
                    <p>© {currentYear} ATHARVA NAVLEKAR. ALL RIGHTS RESERVED.</p>
                    <p>THIS DIGITAL ENVIRONMENT AND ITS CONTENTS ARE THE EXCLUSIVE INTELLECTUAL PROPERTY OF ATHARVA NAVLEKAR.</p>
                    <p>FOR PROFESSIONAL INQUIRIES, REPOSITORY LICENSING, OR COLLABORATION — USE THE CHANNELS BELOW.</p>
                    <p><span className="hl">THENAVLEKAR.NETLIFY.APP &nbsp;·&nbsp; THENAVLEKAR@GMAIL.COM</span></p>
                </div>
                <div className="fine-stamp" aria-hidden="true">
                    <div className="fine-stamp-text">VERIFIED<br />OWNER<br />{currentYear}</div>
                </div>
            </div>

            {/* ═══ SIGNATURE ═══ */}
            <section className="sig-section">
                <div className="sig-giant" aria-label="Atharva Navlekar">ATHARVA<br /><span className="em">NAVLEKAR</span></div>
                <div className="sig-role">Full Stack Developer &amp; Business Analyst</div>
            </section>

            {/* ═══ FOOTER ═══ */}
            <footer className="site-footer" role="contentinfo">
                <div className="footer-l">© {currentYear} THE.NAVLEKAR</div>
                <div className="footer-r">
                    <a href="https://thenavlekar.netlify.app/" target="_blank" rel="noopener noreferrer">THENAVLEKAR.NETLIFY.APP</a>
                </div>
            </footer>
        </div>
    );
};

export default Ownership;
