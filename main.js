const { app, BrowserWindow } = require('electron');
const path = require('path');
const glob = require('glob');
const ServersService = require('./app/services/servers');
const { Clusters } = require('./app/models/clusters');
const Prefs = require('./app/main-process/prefs');
const PingWrapper = require('./app/main-process/ping');
const { autoUpdater } = require('electron-updater');
const logE = require('electron-log');
const Files = require('./app/main-process/util');
const log = require('./app/main-process/log');
const AliveService = require('./app/services/alive');

let win;

function initialize() {

  loadMainFiles();
  imAlive();

  function createWindow() {
    win = new BrowserWindow({ show: false, width: 1200, height: 475, webPreferences: { nodeIntegration: true }, resizable: true });
    win.loadFile('./index.html');

    //win.setMenuBarVisibility(false);
      win.webContents.openDevTools();

    win.on('closed', () => {
      win = null;
    });

    win.once('ready-to-show', () => {
      win.show();
      getServersFile();
      getUpdate();
      win.webContents.send('version', [app.getVersion()]);
    });

    let data = Prefs.getPreferences();
    if (data != null) {
      console.log("Loading default preferences");
      for(var i = 0; i < data.defaults.length; i++) {
         let cluster = data.defaults[i].cluster;
         let server  = data.defaults[i].server;
         console.log(`Default filter for: ${cluster} - ${server}`);
         win.webContents.executeJavaScript(`var clstrBtn = document.getElementById("${cluster}"); var srvrBtn = document.getElementById("${server}"); clstrBtn.click(); srvrBtn.onchange();`);
      }
    }
  }

  app.allowRendererProcessReuse = true;

  app.on('ready', createWindow);

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (win === null) {
      createWindow();
    }
  });
}

async function getServersFile() {

  win.webContents.send('spinner', [true]);

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

function loadMainFiles() {
  try {
    new Files().create();
    const files = glob.sync(path.join(__dirname, './app/main-process/*.js'));

    files.forEach((file) => { require(file) });
  } catch (error) {
    log.error(error.stack);
  }
}

function getUpdate() {
  logE.transports.file.level = "debug";
  autoUpdater.logger = logE;
  autoUpdater.checkForUpdatesAndNotify();
}

function imAlive() {
  try {
    new AliveService().postImalive(app.getVersion());
  } catch (error) {
    log.error(error.stack);
  }
}

initialize();
