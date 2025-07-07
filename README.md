# Electron Server Manager

A dark-themed, cross-platform desktop application for managing Linux servers over SSH. Install directly from the [Releases](https://github.com/yourusername/electron-server-manager/releases) page. No manual setup or dependencies required.

---

## Table of Contents

1. [Features](#features)  
2. [Download & Installation](#download--installation)  
3. [Usage](#usage)  
4. [Import & Export](#import--export)  
5. [Configuration](#configuration)  
6. [Contributing](#contributing)  
7. [License](#license)  

---

## Features

- **Server Profiles**  
  - Save host, port, username, password or private key.  
  - Add, select and remove servers; list updates instantly.

- **SSH Console & Tools**  
  - Manual command input (press Enter or click Run).  
  - One-click utilities: `uptime`, `df -h`, `free -h`, `ps aux`, `systemctl`, `tail /var/log/syslog`, `top`, `ip addr`, and more.  
  - Persistent working directory with `cd` support.  
  - “Clear” button in console header.

- **Realtime Monitoring**  
  - Live CPU (`%usr`, `%sys`), RAM (used/total), Disk (used/total on `/`) and Network (download/upload speed).  
  - Stats panel alongside the console, refreshing every second.

- **Secure Import/Export**  
  - Export your server list as AES-256-CBC–encrypted JSON (passphrase-protected).  
  - Import and decrypt in-app; passwords are never stored in plaintext.

- **Polished UI**  
  - A smooth theme that's kind to your eyes

---

## Download & Installation

Visit the [Releases](https://github.com/conyum/Server-Manager/releases) page and grab the installer for your platform:

- **Windows**: `Server Manager Setup x.x.x.exe`

Run the downloaded installer to install. no external dependencies needed.

---

## Usage

1. **Add a Server**  
   - Fill in **Host**, **Port**, **Username** and **Password** (or **Private Key**), then **Save**.  
   - Select the server in the sidebar and click **Connect**.

2. **Execute Commands**  
   - Type a command in the **Console** input, press **Enter** or click **Run**, and view the output.  
   - Use the preconfigured tool buttons for common tasks.

3. **Monitor Resources**  
   - View live CPU, RAM, Disk and Network metrics in the stats panel. updated every second.

4. **Manage Profiles**  
   - Remove a server by clicking the ✕ next to its name.  
   - Clear the console output with the ✕ button in the console header.

---

## Import & Export

- **Export**  
  1. Click **Export Servers**.  
  2. Enter a passphrase when prompted.  
  3. Save the encrypted JSON file to your disk.

- **Import**  
  1. Click **Import Servers**.  
  2. Enter the same passphrase used during export.  
  3. Select the encrypted JSON file.  
  4. The server list will update automatically.

---

## Configuration

All user data (server profiles and preferences) is stored locally in an encrypted format. No additional configuration is required out of the box. If you wish to customize the look or behavior, you can modify:

- **CSS** in `style.css`  
- **Command presets** in `renderer.js`

---

## Contributing

Contributions, bug reports and feature requests are welcome!

1. Fork the repository.  
2. Create a branch (`git checkout -b feature/YourFeature`).  
3. Commit your changes with clear messages.  
4. Open a Pull Request detailing your improvements.

Please adhere to existing code style and ensure your changes do not introduce regressions.

---

As github doesnt seem to have the license i usally work with ill state it here - **WTFPL**

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.  
