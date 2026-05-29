window.__weesengEntryLoaded = true;
import("./src/app-main.js").catch((error) => {
  console.error("Failed to start Weeseng Software.", error);
});
