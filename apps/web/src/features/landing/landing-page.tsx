import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../auth/use-auth";
import "./landing.css";

const CAPABILITIES = [
  {
    index: "01",
    title: "Workspaces with real boundaries",
    body: "Multi-tenant workspaces keep teams and data separated. Create a home for each company, client, or initiative without mixing contexts.",
  },
  {
    index: "02",
    title: "Boards that respect how work moves",
    body: "Projects open into Kanban boards with custom columns, rich task detail, assignees, and due dates — built for shipping, not for demos.",
  },
  {
    index: "03",
    title: "Collaboration with roles & invites",
    body: "Invite members by email, assign roles, and control who can manage settings versus who can move work on the board.",
  },
  {
    index: "04",
    title: "Reminders that actually fire",
    body: "Task reminders run on a reliable schedule in the API. Invitation emails send when you invite — no idle queue workers burning your stack.",
  },
] as const;

const STEPS = [
  {
    num: "01",
    title: "Create a workspace",
    body: "Spin up a tenant for your team and start from a clean, owned space.",
  },
  {
    num: "02",
    title: "Invite the people",
    body: "Send invites, set roles, and bring collaborators in with clear permissions.",
  },
  {
    num: "03",
    title: "Ship on the board",
    body: "Organize projects, move tasks through columns, and keep delivery visible.",
  },
] as const;

const STACK = [
  "NestJS",
  "React",
  "TypeScript",
  "PostgreSQL",
  "Drizzle ORM",
  "Redis cache",
  "Render",
] as const;

function CtaPair({ isAuthenticated }: { isAuthenticated: boolean }): React.JSX.Element {
  if (isAuthenticated) {
    return (
      <Link className="landing-btn landing-btn--solid" to="/dashboard">
        Open app
      </Link>
    );
  }

  return (
    <>
      <Link className="landing-btn landing-btn--solid" to="/register">
        Sign up
      </Link>
      <Link className="landing-btn landing-btn--ghost" to="/login">
        Log in
      </Link>
    </>
  );
}

export function LandingPage(): React.JSX.Element {
  const { isAuthenticated, isInitializing } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll(): void {
      setScrolled(window.scrollY > 12);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showAuthed = !isInitializing && isAuthenticated;

  return (
    <div className="landing">
      <div className="landing-grain" aria-hidden="true" />

      <header className={`landing-nav${scrolled ? " is-scrolled" : ""}`}>
        <a className="landing-nav__brand" href="#top">
          Task<span>Flow</span>
        </a>

        <nav className="landing-nav__links" aria-label="Page">
          <a href="#capabilities">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#stack">Stack</a>
        </nav>

        <div className="landing-nav__actions">
          {isInitializing ? null : <CtaPair isAuthenticated={showAuthed} />}
        </div>
      </header>

      <main id="top">
        <section className="landing-hero" aria-labelledby="landing-brand">
          <div className="landing-hero__glow" aria-hidden="true" />
          <div
            className="landing-hero__glow landing-hero__glow--right"
            aria-hidden="true"
          />

          <div className="landing-hero__inner">
            <h1 id="landing-brand" className="landing-hero__brand landing-fade">
              Task<em>Flow</em>
            </h1>
            <div className="landing-hero__rule" aria-hidden="true" />
            <p className="landing-hero__headline landing-fade-delay">
              Work that moves with the team — without losing the plot.
            </p>
            <p className="landing-hero__support landing-fade-delay-2">
              Multi-tenant workspaces, roles, invites, and Kanban boards.
              Built as a serious product, not a throwaway todo demo.
            </p>
            <div className="landing-hero__ctas landing-fade-delay-2">
              {isInitializing ? null : <CtaPair isAuthenticated={showAuthed} />}
            </div>
          </div>
        </section>

        <section className="landing-section landing-story" id="story">
          <div className="landing-section__inner">
            <p className="landing-kicker">The product</p>
            <h2>A workspace system for teams that ship together.</h2>
            <p className="landing-section__lede">
              TaskFlow is a full-stack collaboration platform: NestJS and React
              on PostgreSQL, with workspace tenancy, membership, project boards,
              and operational details like invitation email and task reminders.
              It is meant to be used — and meant to be read as engineering
              craft.
            </p>
          </div>
        </section>

        <section className="landing-section" id="capabilities">
          <div className="landing-section__inner">
            <p className="landing-kicker">Capabilities</p>
            <h2>What you get when you open the app.</h2>
            <div className="landing-caps">
              {CAPABILITIES.map((cap) => (
                <article className="landing-cap" key={cap.index}>
                  <span className="landing-cap__index">{cap.index}</span>
                  <h3>{cap.title}</h3>
                  <p>{cap.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section" id="how-it-works">
          <div className="landing-section__inner">
            <p className="landing-kicker">How it works</p>
            <h2>Three moves from empty to underway.</h2>
            <div className="landing-steps">
              {STEPS.map((step) => (
                <article className="landing-step" key={step.num}>
                  <span className="landing-step__num">{step.num}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section landing-stack" id="stack">
          <div className="landing-section__inner">
            <p className="landing-kicker">Stack</p>
            <h2>Built like a product you would deploy at work.</h2>
            <p className="landing-section__lede">
              Auth sessions, RBAC inside workspaces, and clear tenant
              boundaries — with Redis used for caching, not as a noisy queue
              tax on a free plan.
            </p>
            <ul className="landing-stack__list">
              {STACK.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="landing-section landing-cta" id="get-started">
          <div className="landing-section__inner">
            <p className="landing-kicker">Begin</p>
            <h2>Open a workspace. Invite the room. Move the work.</h2>
            <p className="landing-section__lede">
              {showAuthed
                ? "You are already signed in — continue where your teams live."
                : "Create an account in a minute, or log in if you already have one."}
            </p>
            <div className="landing-cta__actions">
              {isInitializing ? null : <CtaPair isAuthenticated={showAuthed} />}
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <p>
            <strong>TaskFlow</strong> · {new Date().getFullYear()}
          </p>
          <p>
            {showAuthed ? (
              <Link to="/dashboard">Open app</Link>
            ) : (
              <>
                <Link to="/login">Log in</Link>
                {" · "}
                <Link to="/register">Sign up</Link>
              </>
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}
