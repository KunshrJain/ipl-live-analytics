export function Table({ head, rows }) {
  return (
    <table>
      <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={j ? 'n' : undefined}>{c}</td>)}</tr>)}</tbody>
    </table>
  );
}

export const Card = ({ title, note, className = '', children }) => (
  <div className={'card ' + className}>
    {title && <h3>{title}{note && <small>{note}</small>}</h3>}
    {children}
  </div>
);

export const Kpi = ({ label, value }) => <div className="kpi"><small>{label}</small><b>{value}</b></div>;
