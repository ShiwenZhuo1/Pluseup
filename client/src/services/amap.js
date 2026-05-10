let amapScriptPromise;

export async function loadAmap() {
  if (window.AMap) {
    return window.AMap;
  }

  if (amapScriptPromise) {
    return amapScriptPromise;
  }

  const key = import.meta.env.VITE_AMAP_KEY;
  const securityJsCode = import.meta.env.VITE_AMAP_SECURITY_JS_CODE;

  if (!key) {
    throw new Error("Missing VITE_AMAP_KEY. Add it in client/.env.local.");
  }

  if (securityJsCode) {
    window._AMapSecurityConfig = {
      securityJsCode
    };
  }

  amapScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`;
    script.async = true;
    script.onload = () => {
      if (window.AMap) {
        resolve(window.AMap);
        return;
      }
      reject(new Error("AMap loaded but window.AMap is unavailable."));
    };
    script.onerror = () => {
      reject(new Error("Failed to load AMap JSAPI script."));
    };
    document.head.appendChild(script);
  });

  return amapScriptPromise;
}

export async function ensureAmapPlugins(plugins) {
  const AMap = await loadAmap();

  await new Promise((resolve) => {
    AMap.plugin(plugins, () => resolve());
  });

  return AMap;
}
