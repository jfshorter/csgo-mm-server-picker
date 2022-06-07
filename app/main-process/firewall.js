const { app } = require('electron');
const sudo = require('sudo-prompt');
const { Clusters } = require('../models/clusters');
const PingWrapper = require('./ping');
const ServersService = require('../services/servers');
const fs = require('fs');
const Files = require('./util');
const log = require('./log');

let Firewall = function (win, clustersId, clusters) {
  this._clustersId = clustersId;
  this._clusters = clusters;
  this._win = win;
}

Firewall.prototype.exec = function (ipList) {
  const multipleIp = ipList.join();

  switch (process.platform) {
    case 'win32':
      _execBash(`netsh advfirewall firewall add rule name="csgo-mm-server-picker" dir=out action=block remoteip=${multipleIp}`, this._win);
      break;

    case 'linux':
      console.log(`pkexec env DISPLAY=$DISPLAY XAUTHORITY=$XAUTHORITY iptables -A INPUT -s ${multipleIp} -j DROP -m comment --comment "CSGOSERVERPICKER"`);
      _execBash(`pkexec env DISPLAY=$DISPLAY XAUTHORITY=$XAUTHORITY iptables -A INPUT -s ${multipleIp} -j DROP -m comment --comment "CSGOSERVERPICKER"`, this._win);
      break;

    case 'darwin':

      break;

    default:
      break;
  }
}

Firewall.prototype.reset = function () {
  switch (process.platform) {
    case 'win32':
      _execBash(`netsh advfirewall firewall delete rule name="csgo-mm-server-picker"`, this._win);
      break;

    case 'linux':
      //console.log(`pkexec env DISPLAY=$DISPLAY XAUTHORITY=$XAUTHORITY "${app.getAppPath()}/app/main-process/reset_iptables.bash"`);
      //let command = "#!/usr/bin/env bash\n";
      //command += "iptables -S INPUT | awk '{if ($0 ~ /CSGOSERVERPICKER/){print (NR-1)}}' > iptables_ruleids.list\n";
      //command += "RIDS=($(cat iptables_ruleids.list | sort -nr))\n";
      //command += 'for RID in "${RIDS[@]}"\ndo\n  iptables -D INPUT $RID\ndone\nrm iptables_ruleids.list\n';
      //_execBash(`pkexec env DISPLAY=$DISPLAY XAUTHORITY=$XAUTHORITY "${app.getPath()}/app/main-process/reset_iptables.bash"`, this._win);
      //fs.writeFile(`${app.getAppPath()}/reset_iptables.bash`, command, {mode: 0o750}, (err) => {if(err){console.log(err)}});
      _execBash(`pkexec env DISPLAY=$DISPLAY XAUTHORITY=$XAUTHORITY "${app.getAppPath()}/app/main-process/reset_iptables.bash"`, this._win);
      break;

    case 'darwin':

      break;

    default:
      break;
  }
}

function _execBash(command, win) {
  const options = {
    name: 'csgommserverpicker'
  };

  sudo.exec(command, options,
    function (error, stdout, stderr) {
      _ping(win);
      if (stderr !== '' && stderr !== undefined && !stderr.toUpperCase().includes('BAD RULE')) {
        log.error(`stderr: ${stderr}`);
      }
    }
  );
}

function _ping(win) {
  const request = async () => {
    return new ServersService().getServersList();
  }

  request().then((response) => {
    const clusters = new Clusters(response.data);
    clusters.convert();

    const ping = new PingWrapper(clusters, win);
    ping.execute();
  }).catch((error) => {
    log.error(error.stack);
  });
}

module.exports = Firewall;
