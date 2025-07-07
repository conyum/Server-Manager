window.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const addForm   = $('addForm');
  const srvList   = $('serverList');
  const status    = $('status');
  const connectBtn= $('connectBtn');
  const cmdInput    = $('manualInput');
  const runBtn      = $('runBtn');
  const clearBtn    = $('clearBtn');
  const consoleOutput = $('consoleOutput');
  const uptimeBtn     = $('uptimeBtn');
  const diskBtn       = $('diskBtn');
  const memBtn        = $('memBtn');
  const psBtn         = $('psBtn');
  const svcListBtn    = $('svcListBtn');
  const svcRestartBtn = $('svcRestartBtn');
  const updateSysBtn  = $('updateSysBtn');
  const logsBtn       = $('logsBtn');
  const topBtn        = $('topBtn');
  const netBtn        = $('netBtn');
  const usersBtn      = $('usersBtn');
  const portsBtn      = $('portsBtn');
  const cronBtn       = $('cronBtn');
  const backupBtn     = $('backupBtn');
  const cdBtn         = $('cdBtn');
  const lsBtn         = $('lsBtn');
  const sudoBtn       = $('sudoBtn');
  const speedBtn      = $('speedBtn');
  const whoBtn        = $('whoBtn');
  const exportBtn     = $('exportBtn');
  const importBtn     = $('importBtn');
  const statCpu       = $('statCpu');
  const statRam       = $('statRam');
  const statDisk      = $('statDisk');
  const statNet       = $('statNet');

  let servers = [], selectedIdx = null, connected = false;
  let statsInterval = null, prevRx = 0, prevTx = 0;
  let currentDir = '';

  function updateUI() {
    const can = connected;
    [
      runBtn, cmdInput, clearBtn,
      uptimeBtn, diskBtn, memBtn, psBtn, svcListBtn, svcRestartBtn,
      updateSysBtn, logsBtn, topBtn, netBtn, usersBtn, portsBtn, cronBtn, backupBtn, cdBtn, lsBtn, sudoBtn, speedBtn, whoBtn
    ].forEach(el => el.disabled = !can);
    connectBtn.textContent = connected ? 'Disconnect' : 'Connect';
  }

  function setStatus(text, state) {
    status.textContent = text;
    status.className = `status-${state}`;
  }

  async function loadServers() {
    servers = await window.api.getServers();
    srvList.innerHTML = '';
    servers.forEach((srv, idx) => {
      const li = document.createElement('li');
      li.textContent = `${srv.username}@${srv.host}`;
      li.onclick = () => selectServer(idx);
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '✕';
      removeBtn.className = 'remove-btn';
      removeBtn.onclick = async e => {
        e.stopPropagation();
        await window.api.removeServer(idx);
        await loadServers();
        selectServer(null);
      };
      li.appendChild(removeBtn);
      srvList.appendChild(li);
    });
    exportBtn.disabled = servers.length === 0;
  }

  function selectServer(idx) {
    selectedIdx = idx;
    connected = false;
    setStatus('Not connected', 'default');
    updateUI();
    consoleOutput.textContent = '';
    clearInterval(statsInterval);
    prevRx = prevTx = 0;
    [statCpu, statRam, statDisk, statNet].forEach(el => el.textContent = '-');
    Array.from(srvList.children).forEach((li,i) => 
      li.classList.toggle('selected', i === idx)
    );
  }

  addForm.onsubmit = async e => {
  e.preventDefault();
  const srv = {
    host:       document.getElementById('host').value,
    port:       parseInt(document.getElementById('port').value, 10),
    username:   document.getElementById('username').value,
    password:   document.getElementById('password').value,
    privateKey: document.getElementById('privateKey').value
  };

  const res = await window.api.addServer(srv);
  if (!res.success) {
    return alert('Failed to add server');
  }

  await loadServers();
  selectServer(servers.length - 1);
  addForm.reset();
};

  connectBtn.onclick = async () => {
    if (selectedIdx === null) return;
    if (!connected) {
      setStatus('Connecting...', 'connecting');
      const res = await window.api.connectServer(servers[selectedIdx], selectedIdx);
      if (res.success) {
        connected = true;
        setStatus(`Connected to ${servers[selectedIdx].username}@${servers[selectedIdx].host}`, 'success');
        const pwdRes = await window.api.runCommand('pwd');
        currentDir = pwdRes.stdout.trim();
        statsInterval = setInterval(fetchStats, 1000);
      } else {
        setStatus(`Error: ${res.error}`, 'error');
      }
    } else {
      await window.api.disconnectServer();
      connected = false;
      setStatus('Not connected', 'default');
      consoleOutput.textContent = '';
      clearInterval(statsInterval);
      prevRx = prevTx = 0;
      [statCpu, statRam, statDisk, statNet].forEach(el => el.textContent = '-');
    }
    updateUI();
  };

  exportBtn.onclick = async () => {
  if (!servers.length) return;
  const res = await window.api.exportServers(servers);
  alert(res.success ? 'Exported!' : `Failed: ${res.error||'cancelled'}`);
};

  importBtn.onclick = async () => {
  const res = await window.api.importServers();
  if (res.success) {
    await loadServers(); updateUI();
    alert('Imported!');
  } else {
    alert(`Failed: ${res.error||'cancelled or wrong passphrase'}`);
  }
};

  async function runTool(cmd) {
    if (cmd.startsWith('cd ')) {
    const target = cmd.slice(3).trim();
    consoleOutput.textContent += `$ cd ${target}\n`;
    const cdRes = await window.api.runCommand(
      `cd ${currentDir} && cd ${target} && pwd`
    );
    if (!cdRes.error) {
      currentDir = cdRes.stdout.trim();
      consoleOutput.textContent += `${currentDir}\n`;
    } else {
      consoleOutput.textContent += `Error: ${cdRes.error || cdRes.stderr}\n`;
    }
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
    return;
  }

  const fullCmd = `${currentDir ? `cd ${currentDir} && ` : ''}${cmd}`;
  consoleOutput.textContent += `$ ${cmd}\n`;
  const res = await window.api.runCommand(fullCmd);
    consoleOutput.textContent += (res.stdout || '') + 
                                (res.stderr ? `Stderr: ${res.stderr}\n` : '') + 
                                (res.error  ? `Error: ${res.error}\n`  : '');
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  }

  async function handleManual() {
    const text = cmdInput.value.trim();
    if (!text) return;
    await runTool(text);
    cmdInput.value = '';
  }

  runBtn.addEventListener('click', handleManual);
  cmdInput.addEventListener('keypress', e => {
    if (e.key === 'Enter' && !runBtn.disabled) {
      e.preventDefault();
      handleManual();
    }
  });

  clearBtn.onclick = () => { consoleOutput.textContent = ''; };
  uptimeBtn.onclick     = () => runTool('uptime');
  diskBtn.onclick       = () => runTool('df -h');
  memBtn.onclick        = () => runTool('free -h');
  psBtn.onclick         = () => runTool('ps aux');
  svcListBtn.onclick    = () => runTool('systemctl list-units --type=service');
  svcRestartBtn.onclick = () => {
    const svc = prompt('Service to restart:');
    if (svc) runTool(`sudo systemctl restart ${svc}`);
  };
  updateSysBtn.onclick  = () => runTool('sudo apt update && sudo apt upgrade -y');
  logsBtn.onclick       = () => runTool('tail -n 50 /var/log/syslog');
  topBtn.onclick        = () => runTool('top -b -n 1');
  netBtn.onclick        = () => runTool('ip addr');
  usersBtn.onclick      = () => runTool("cut -d: -f1 /etc/passwd");
  portsBtn.onclick      = () => runTool('ss -tulpn');
  cronBtn.onclick       = () => runTool('crontab -l');
  backupBtn.onclick     = () => runTool('tar czf backup-$(date +%F).tgz /var/www');
  cdBtn.onclick         = () => runTool('cd ..');
  lsBtn.onclick         = () => runTool('ls -a');
  sudoBtn.onclick       = () => runTool('sudo su');
  speedBtn.onclick      = () => runTool('speedtest');
  whoBtn.onclick        = () => runTool('whoami');

  async function fetchStats() {
    try {
      const cpuRes = await window.api.runCommand(
        `top -bn1 | grep 'Cpu(s)' | awk '{print $2"%usr, "$4"%sys"}'`
      );
      statCpu.textContent = cpuRes.stdout.trim();
      const ramRes = await window.api.runCommand(
        `free -m | awk '/Mem/ {printf "%s/%sMB", $3, $2}'`
      );
      statRam.textContent = ramRes.stdout.trim();
      const diskRes = await window.api.runCommand(
        `df -h / | awk 'NR==2{printf "%s/%s", $3, $2}'`
      );
      statDisk.textContent = diskRes.stdout.trim();
      const netRes = await window.api.runCommand(
        `cat /proc/net/dev | grep ':' | grep -v lo | awk '{rx+=$2; tx+=$10} END {print rx, tx}'`
      );
      const [rx, tx] = netRes.stdout.trim().split(/\s+/).map(Number);
      const interval = 1;
      const downRate = (rx - prevRx) / interval;
      const upRate   = (tx - prevTx) / interval;
      prevRx = rx; prevTx = tx;
      statNet.textContent = `${formatSpeed(downRate)} ↓, ${formatSpeed(upRate)} ↑`;
    } catch (e) {
      console.error('Stats error', e);
    }
  }

  function formatSpeed(bytes) {
    if (bytes < 1024) return `${bytes} B/s`;
    if (bytes < 1024 * 1024) return `${(bytes/1024).toFixed(1)} KB/s`;
    return `${(bytes/1024/1024).toFixed(1)} MB/s`;
  }

  loadServers().then(updateUI);
});
