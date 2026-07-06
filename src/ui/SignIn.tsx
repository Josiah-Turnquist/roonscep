import { useState } from 'react';

// The multiplayer entry screen: claim a username and your character persists to
// it — sign in with the same name from any device to resume. (Presentational
// only; the real Neon Auth login slots in here later.)
export default function SignIn({ onSignIn }: { onSignIn: (username: string, name: string) => void }) {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) onSignIn(username, name);
  };

  return (
    <div className="mp-screen">
      <h1>⚔️ Roonscep</h1>
      <p className="muted">Enter the realm. Your character persists to your name — return anytime to resume.</p>
      <form className="signin-form" onSubmit={submit}>
        <label>
          Username
          <input
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. josiah"
            maxLength={24}
          />
        </label>
        <label>
          Display name <span className="muted small">(optional)</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="shown to other players"
            maxLength={24}
          />
        </label>
        <button className="btn primary big" type="submit" disabled={!username.trim()}>
          Enter the realm
        </button>
      </form>
      <p className="muted small">
        No password yet — this is a local/beta sign-in. Accounts get secured by Neon Auth in
        production.
      </p>
    </div>
  );
}
