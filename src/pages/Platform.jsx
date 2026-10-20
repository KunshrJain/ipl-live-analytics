import { Fragment, useState } from 'react';
import { API } from '../api/api.js';
import { Card } from '../components/ui.jsx';

export default function Platform() {
  const C = window.IPL_CONFIG;
  const [out, setOut] = useState('');
  const rows = [['Mode', API.mode], ['API base URL', C.API_BASE_URL], ['WebSocket URL', C.WS_URL || 'not set (HTTP polling)'], ['Poll interval', C.POLL_INTERVAL_MS + ' ms'], ['Auth', C.AUTH.ENABLED ? 'enabled' : 'disabled']];
  const check = () => {
    setOut('Checking...');
    API.health().then((r) => setOut('OK: ' + JSON.stringify(r))).catch((e) => setOut('Failed: ' + e.message));
  };
  return (
    <>
      <Card title="Cloud architecture">
        <div className="arch">
          <div className="node">Users</div><i>&rarr;</i>
          <div className="node">Load Balancer</div><i>&rarr;</i>
          <div className="node strong">EC2 Auto Scaling<br /><small>API, analytics, auth, notifications</small></div><i>&rarr;</i>
          <div className="node">Queue / Stream</div><i>&rarr;</i>
          <div className="node">Database</div>
        </div>
        <div className="arch sub">
          <div className="node">S3 bucket<br /><small>static frontend, history</small></div>
          <div className="node">Ingestion service<br /><small>match data source</small></div>
          <div className="node">Monitoring<br /><small>metrics, alarms, logs</small></div>
        </div>
      </Card>
      <div className="grid g2">
        <Card title="Backend connection">
          <dl className="kv">{rows.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>)}</dl>
          <button className="btn" onClick={check}>Run health check</button>
          <p className="muted">{out}</p>
        </Card>
        <Card title="Sustainable Development Goals">
          <ul className="sdg">
            <li><b>SDG 9</b> Industry, Innovation and Infrastructure</li>
            <li><b>SDG 8</b> Decent Work and Economic Growth</li>
            <li><b>SDG 4</b> Quality Education</li>
            <li><b>SDG 17</b> Partnerships for the Goals</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
