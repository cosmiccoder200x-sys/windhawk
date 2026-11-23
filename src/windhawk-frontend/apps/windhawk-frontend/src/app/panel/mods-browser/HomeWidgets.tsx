import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Button, Select, theme } from 'antd';
import type { InstalledModEntry } from '../shared/installedMod';
import { modIsRunning } from '../shared/nukedMod';

const Shelf = styled.section`
  display: flex; flex-wrap: wrap; gap: 12px; margin: 0 0 18px;
  & > article { flex: 1 1 165px; min-width: 0; padding: 14px 18px; border: 1px solid var(--widget-border); border-radius: 18px; background: var(--widget-bg); }
  h3 { margin: 0 0 8px; font-size: 14px; }
  button { margin: 2px; }
  time { font-size: 1.6rem; font-variant-numeric: tabular-nums; }
`;
const pinKey = 'windhawk.home.pinned';
function readPins(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(pinKey) || '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch { return []; }
}

export function WidgetShelf({ mods, filters, filter, open }: {
  mods?: Record<string, InstalledModEntry> | null;
  filters: Set<string>; filter: (status: string) => void; open: (id: string) => void;
}) {
  const { token } = theme.useToken();
  const [now, setNow] = useState(() => new Date());
  const [pins, setPins] = useState(readPins);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 15000);
    return () => window.clearInterval(timer);
  }, []);
  const entries = Object.entries(mods ?? {});
  const enabled = entries.filter(([, mod]) => modIsRunning(mod.config)).length;
  return <Shelf aria-label="Workspace widgets" style={{
    '--widget-bg': token.colorFillQuaternary, '--widget-border': token.colorBorderSecondary
  } as React.CSSProperties}>
    <article><h3>{now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
      <time>{now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</time></article>
    <article><h3>Mod status</h3>{['enabled', 'disabled'].map(status =>
      <Button key={status} disabled={!mods} aria-pressed={filters.has(status)} type={filters.has(status) ? 'primary' : 'default'} onClick={() => filter(status)}>
        {status === 'enabled' ? 'Enabled' : 'Disabled'} · {mods ? (status === 'enabled' ? enabled : entries.length - enabled) : '…'}
      </Button>)}</article>
    <article><h3>Pinned mods</h3><Select mode="multiple" aria-label="Choose pinned mods" placeholder="Choose mods" style={{width:'100%'}}
      disabled={!mods} value={pins.filter(id => mods?.[id])} options={entries.map(([value,m]) => ({value,label:m.metadata?.name || value}))}
      optionFilterProp="label" onChange={(ids: string[]) => { setPins(ids); try { localStorage.setItem(pinKey, JSON.stringify(ids)); } catch { /* Session pins still work. */ } }} />
      {pins.filter(id => mods?.[id]).map(id => <Button type="link" key={id} onClick={() => open(id)}>{mods?.[id].metadata?.name || id}</Button>)}
    </article>
  </Shelf>;
}

const previews = [
  ['Taskbar', 'windows-11-taskbar-styler', '▦   ◉   ▤   ◈'],
  ['Start menu', 'windows-11-start-menu-styler', '▦　◈　▤　◉'],
  ['File Explorer', 'windows-11-file-explorer-styler', '▱　 Documents　 Pictures'],
];
const Stage = styled.div`
  position: relative; overflow: hidden; border-radius: 12px; margin: 10px 0; height: 76px;
  div { position: absolute; inset: 0; display: grid; place-content: center; background: #343944; color: white; }
  div + div { background: linear-gradient(115deg,#21315c,#625088); }
  span { padding: 6px 14px; } div + div span { border-radius: 14px; background: #ffffff28; }
  @media (prefers-reduced-motion: no-preference) { span { animation: appear .18s ease-out; } @keyframes appear { from { opacity: .35; } } }
`;
export function AppearancePreview({open}: {open: (id: string) => void}) {
  const [index, select] = useState(0);
  const [position, move] = useState(50);
  const [name,id,items] = previews[index];
  return <section aria-label="Appearance concepts"><h3>Appearance concepts</h3>
    {previews.map(([label],i) => <Button key={label} aria-pressed={i === index} type={i === index ? 'primary':'text'} onClick={() => select(i)}>{label}</Button>)}
    <Stage key={id} aria-hidden><div><span>{items}</span></div><div style={{clipPath:'inset(0 '+(100-position)+'% 0 0)'}}><span>{items}</span></div></Stage>
    <label>Compare styles <input aria-label={name+' style comparison'} type="range" min="0" max="100" value={position} onChange={e => move(Number(e.target.value))}/></label>
    <Button type="link" onClick={() => open(id)}>View mod</Button>
  </section>;
}
