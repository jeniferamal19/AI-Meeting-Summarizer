import { useEffect, useState } from "react";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  Zap,
  AudioLines,
  FileText,
  ListChecks,
  X,
  Sparkles,
  CircleHelp,
  ArrowUpRight,
} from "lucide-react";
import BrandLogo from "./BrandLogo";
import { supabase } from "../supabase";

const DEMO_CREDENTIALS = { email: "sarah@company.com", password: "demo1234" };

export default function Auth({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(true);
  const [showForgotNote, setShowForgotNote] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  function openAccountForm(signUp) {
    setIsSignUp(signUp);
    setAuthOpen(true);
  }

  useEffect(() => {
    if (!authOpen) return undefined;

    function closeOnEscape(event) {
      if (event.key === "Escape") setAuthOpen(false);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [authOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (isSignUp) {
      if (!formData.name) {
        setError("Please enter your full name.");
        return;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      let result;
      if (isSignUp) {
        result = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { data: { name: formData.name } },
        });
      } else {
        result = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
      }

      if (result.error) {
        setError(result.error.message);
        setLoading(false);
        return;
      }

      const session = result.data.session;
      if (!session) {
        setError("Account created. Please check your email to confirm it, then sign in.");
        setLoading(false);
        return;
      }

      const sbUser = result.data.user;
      onAuthSuccess({
        id: sbUser.id,
        name: sbUser.user_metadata?.name || sbUser.email.split("@")[0],
        email: sbUser.email,
      });
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  function handleDemoAutoFill() {
    setError("");
    setFormData((f) => ({ ...f, email: DEMO_CREDENTIALS.email, password: DEMO_CREDENTIALS.password }));
  }

  return (
    <div className="auth-shell" id="top">
      <header className={`auth-topbar${scrolled ? " auth-topbar--scrolled" : ""}`}>
        <a className="landing-logo-chip" href="#top" aria-label="EchoNote home">
          <BrandLogo surface="chip" />
        </a>
        <nav className="auth-nav" aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#blog">Blog</a>
          <a href="#how-it-works">How it works</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="auth-nav__actions">
          <button type="button" className="auth-nav__signin" onClick={() => openAccountForm(false)}>
            Login
          </button>
          <button type="button" className="auth-nav__cta" onClick={() => openAccountForm(true)}>
            Get started <span className="round-arrow"><ArrowUpRight size={14} /></span>
          </button>
        </div>
      </header>

      <main>
        <section className="auth-page landing-hero" aria-labelledby="landing-title">
          <div className="auth-page__content">
            <p className="hero__eyebrow"><span className="hero__eyebrow-mark" /> A clearer way to meet</p>
            <h1 className="hero__title" id="landing-title">
              Every word.<br />Every decision.<br /><em>One clear note.</em>
            </h1>
            <p className="hero__sub">
              Turn meeting recordings into thoughtful summaries, speaker-aware transcripts, and next steps your team can trust.
            </p>
            <form
              className="hero-signup"
              onSubmit={(event) => {
                event.preventDefault();
                openAccountForm(true);
              }}
            >
              <label className="hero-signup__field">
                <span aria-hidden="true">AI</span>
                <input
                  type="email"
                  name="email"
                  placeholder="Your work email"
                  value={formData.email}
                  onChange={handleChange}
                  aria-label="Your work email"
                  required
                />
              </label>
              <button type="submit" className="btn btn--primary">
                Get started <span className="round-arrow"><ArrowUpRight size={15} /></span>
              </button>
            </form>
            <span className="hero-caption"><Sparkles size={13} /> Your meetings, made useful</span>
            <div className="hero-proof">
              <span><Check size={14} /> Audio and video recordings</span>
              <span><Check size={14} /> Exportable meeting notes</span>
            </div>
          </div>

          <div className="hero-art" aria-label="Illustration of a meeting conversation becoming organized notes" role="img">
            <div className="hero-art__glow" />
            <div className="hero-art__orb hero-art__orb--blue" />
            <div className="hero-art__orb hero-art__orb--amber" />
            <div className="hero-art__orb hero-art__orb--red" />
            <div className="hero-art__ring hero-art__ring--one" />
            <div className="hero-art__ring hero-art__ring--two" />
            <div className="hero-art__bubble hero-art__bubble--one">
              <span className="hero-art__speaker">ALEX · 02:14</span>
              “I’ll share the first draft by Friday.”
            </div>
            <div className="hero-art__bubble hero-art__bubble--two">
              <span className="hero-art__speaker">KEY DECISION</span>
              Review together next week <Check size={13} />
            </div>
            <div className="hero-art__bubble hero-art__bubble--three">
              <span className="hero-art__wave"><i /><i /><i /><i /><i /><i /><i /></span>
              Clear notes from every conversation
            </div>
            <span className="hero-art__caption">FROM CONVERSATION TO CLARITY</span>
          </div>
        </section>

        <section className="landing-proof-panel" id="story" aria-label="EchoNote meeting workflow">
          <div className="landing-proof-panel__quote">
            <span className="landing-proof-panel__mark">“</span>
            <div>
              <p>Good meetings create momentum. EchoNote makes sure the important parts come with you.</p>
              <span className="landing-proof-panel__byline">A calmer way to keep work moving</span>
            </div>
          </div>
          <div className="landing-proof-panel__flow" aria-label="Meeting workflow">
            <span><AudioLines size={15} /> Recording</span>
            <i />
            <span><FileText size={15} /> Transcript</span>
            <i />
            <span><ListChecks size={15} /> Next steps</span>
          </div>
        </section>

        <section className="landing-section landing-features" id="features">
          <div className="landing-section__heading landing-section__heading--left">
            <p className="landing-section__eyebrow">Everything in its place</p>
            <h2>Less note-taking.<br /><span>More forward motion.</span></h2>
            <p>Keep the useful parts of every conversation together, ready when your team needs them.</p>
          </div>
          <div className="landing-bento">
            <article className="landing-bento__card landing-bento__card--transcript">
              <span className="landing-bento__icon"><AudioLines size={19} /></span>
              <p className="landing-bento__label">A transcript you can follow</p>
              <h3>Know who said what.</h3>
              <p>Speaker-aware transcripts make it easier to revisit the details and find the moment you need.</p>
              <div className="landing-mini-transcript">
                <span className="landing-mini-transcript__avatar">A</span>
                <span><b>Alex Morgan</b><i>Let’s share the first draft by Friday.</i></span>
                <small>02:14</small>
              </div>
            </article>
            <article className="landing-bento__card landing-bento__card--decisions">
              <span className="landing-bento__icon"><Check size={19} /></span>
              <p className="landing-bento__label">The signal, not the noise</p>
              <h3>Decisions made clear.</h3>
              <p>Bring key takeaways and blockers into focus without replaying the whole conversation.</p>
              <div className="landing-decision"><span /> Align on the first draft before review</div>
            </article>
            <article className="landing-bento__card landing-bento__card--actions">
              <span className="landing-bento__icon"><ListChecks size={19} /></span>
              <p className="landing-bento__label">A next step for everyone</p>
              <h3>Turn talk into action.</h3>
              <p>Action items are gathered with owners and dates when they’re mentioned.</p>
              <div className="landing-task"><span className="landing-task__check"><Check size={11} /></span><span>Share the first draft</span><small>Alex · Friday</small></div>
            </article>
          </div>
        </section>

        <section className="landing-section landing-how" id="how-it-works">
          <div className="landing-section__heading">
            <p className="landing-section__eyebrow">A simple rhythm</p>
            <h2>From record to ready.</h2>
            <p>Your team keeps the conversation. EchoNote keeps the details organized.</p>
          </div>
          <div className="landing-steps">
            <article className="landing-step"><span className="landing-step__number">01</span><h3>Add a recording</h3><p>Upload an audio or video file from a meeting.</p></article>
            <article className="landing-step"><span className="landing-step__number">02</span><h3>Review the summary</h3><p>Explore the transcript, decisions, and action items.</p></article>
            <article className="landing-step"><span className="landing-step__number">03</span><h3>Share what matters</h3><p>Copy or export polished notes for your team.</p></article>
          </div>
        </section>

        <section className="landing-section landing-journal" id="blog">
          <div className="landing-section__heading landing-section__heading--left">
            <p className="landing-section__eyebrow">From the journal</p>
            <h2>Small habits.<br /><span>Better meetings.</span></h2>
            <p>Simple ideas for bringing more clarity to the conversations you already have.</p>
          </div>
          <div className="landing-journal__grid">
            <article><span>01 / FOLLOW-THROUGH</span><h3>Why decisions disappear after the call</h3><p>Make the outcome easy to find while it’s still fresh.</p></article>
            <article><span>02 / ACTION ITEMS</span><h3>Every next step needs an owner</h3><p>Turn a good intention into a clear commitment.</p></article>
            <article><span>03 / MEETING NOTES</span><h3>Close with a two-minute recap</h3><p>End the meeting with the same understanding you started building.</p></article>
          </div>
        </section>

        <section className="landing-pricing" id="pricing">
          <div>
            <p className="landing-section__eyebrow">Get started</p>
            <h2>Make your next meeting easier to follow.</h2>
            <p>Explore EchoNote with your own recording and see the notes take shape.</p>
          </div>
          <button type="button" className="btn btn--primary" onClick={() => openAccountForm(true)}>
            Get started <span className="round-arrow"><ArrowUpRight size={15} /></span>
          </button>
        </section>

        <section className="landing-section landing-faq" id="faq">
          <div className="landing-section__heading">
            <p className="landing-section__eyebrow">A few details</p>
            <h2>Questions, answered.</h2>
          </div>
          <div className="landing-faq__list">
            {[
              ["What can I upload?", "EchoNote accepts common audio and video recordings, including MP3, WAV, M4A, MP4, WebM, and OGG files."],
              ["What will I get back?", "A transcript and a structured summary with key decisions, risks, action items, and topics discussed."],
              ["Can I share the notes?", "Yes. Copy the summary or export meeting notes as Markdown, PDF, or DOCX."],
            ].map(([question, answer], index) => (
              <details
                className="landing-faq__item"
                key={question}
                open={openFaq === index}
                onToggle={(event) => {
                  if (event.currentTarget.open) setOpenFaq(index);
                }}
              >
                <summary><span>{question}</span><CircleHelp size={17} /></summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      {authOpen && (
        <div
          className="auth-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAuthOpen(false);
          }}
        >
          <section className="auth-card" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
            <button
              type="button"
              className="auth-modal__close"
              onClick={() => setAuthOpen(false)}
              aria-label="Close sign in"
            >
              <X size={18} />
            </button>
            <h2 className="auth-card__title" id="auth-modal-title">{isSignUp ? "Create your account" : "Welcome back"}</h2>
            <p className="auth-card__sub">
              {isSignUp
                ? "Start turning conversations into clear next steps."
                : "Sign in to pick up where your team left off."}
            </p>

            <div className="mode-tabs" style={{ width: "100%", marginBottom: "22px" }}>
              <button
                type="button"
                className={`mode-tab ${!isSignUp ? "mode-tab--active" : ""}`}
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => setIsSignUp(false)}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`mode-tab ${isSignUp ? "mode-tab--active" : ""}`}
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => setIsSignUp(true)}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="error-banner">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {isSignUp && (
                <div className="form-group">
                  <label className="form-label" htmlFor="name">Full name</label>
                  <div className="form-input-wrap">
                    <User size={16} />
                    <input
                      id="name"
                      type="text"
                      name="name"
                      placeholder="Alex Morgan"
                      value={formData.name}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="email">Work email</label>
                <div className="form-input-wrap">
                  <Mail size={16} />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="sarah@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="form-label-row">
                  <label className="form-label" htmlFor="password">Password</label>
                  {!isSignUp && (
                    <button
                      type="button"
                      className="form-forgot-link"
                      onClick={() => setShowForgotNote(true)}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="form-input-wrap">
                  <Lock size={16} />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input"
                    style={{ paddingRight: "48px" }}
                  />
                  <button
                    type="button"
                    className="form-input-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {showForgotNote && !isSignUp && (
                  <p className="form-forgot-note">Password reset isn't wired up in this demo yet.</p>
                )}
              </div>

              {isSignUp && (
                <div className="form-group">
                  <label className="form-label" htmlFor="confirmPassword">Confirm password</label>
                  <div className="form-input-wrap">
                    <Lock size={16} />
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                </div>
              )}

              {!isSignUp && (
                <div className="form-checkbox-row">
                  <input
                    id="remember"
                    type="checkbox"
                    className="form-checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <label htmlFor="remember" className="form-checkbox-label">
                    Remember session on this device
                  </label>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn btn--primary btn--block">
                {loading ? "Please wait…" : isSignUp ? "Create your account" : "Sign in"}
              </button>
            </form>

            {!isSignUp && (
              <>
                <div className="form-divider">
                  <span>Want to take a look?</span>
                </div>
                <button type="button" className="btn btn--ghost btn--block" onClick={handleDemoAutoFill}>
                  <Zap size={15} />
                  Fill in demo details
                </button>
              </>
            )}
          </section>
        </div>
      )}

      <footer className="landing-footer">
        <a className="landing-footer__logo" href="#top" aria-label="EchoNote home"><BrandLogo surface="dark" /></a>
        <span>Clear notes. Better follow-through.</span>
        <a href="#faq">Frequently asked questions</a>
      </footer>
    </div>
  );
}