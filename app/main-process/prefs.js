const fs = require('fs');
let Prefs = function () { 
  this.data = null;
}

Prefs.getPreferences = function () {
  let rawdata = fs.readFileSync('preferences.json');
  preferenceData = JSON.parse(rawdata);
  Prefs.data = preferenceData;
  return preferenceData;
}

Prefs.savePreferences = function() {
  if (this.data != null) {
    fs.writeFileSync('preferences.json', JSON.stringify(this.data));
  }
}

module.exports = Prefs;
