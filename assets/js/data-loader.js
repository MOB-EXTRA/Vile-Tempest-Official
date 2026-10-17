/**
 * Centralized Repository Data Loader & Sequential Failover Manager
 * Fetches live data directly without caching, using repositories in order.
 */
(function (window) {
  // Define fallback repositories in sequential order (Repo 1 -> Repo 2 -> Repo 3)
  const REPO_CONFIGS = [
    {
      base: "https://mob-extra.github.io/MOBEXTRA.github.shared-data-repo.1",
      name: "Repository 1",
    },
    {
      base: "https://mob-extra.github.io/MOBEXTRA.github.shared-data-repo.2",
      name: "Repository 2",
    },
    {
      base: "https://mob-extra.github.io/MOBEXTRA.github.shared-data-repo.3",
      name: "Repository 3",
    },
  ];

  // Map requested identifiers to their corresponding file paths
  const ENDPOINTS = {
    "redeem-codes": "/codm-redeem-code/redeem-codes.js",
    "test-server": "/codm-test-server/codm-config.js",
  };

  /**
   * Universal data fetcher with sequential repository failover and NO caching
   * @param {string} identifier - e.g. "redeem-codes" or "test-server"
   * @returns {Promise<any>} - Returns parsed data string or object
   */
  async function fetchSharedData(identifier) {
    if (!ENDPOINTS[identifier]) {
      throw new Error(
        `Invalid data identifier: "${identifier}". Use "redeem-codes" or "test-server".`,
      );
    }

    // Sequentially iterate through repositories (Repo 1, then Repo 2, then Repo 3)
    let lastError = null;
    for (let i = 0; i < REPO_CONFIGS.length; i++) {
      const repo = REPO_CONFIGS[i];
      const targetUrl = `${repo.base}${ENDPOINTS[identifier]}`;

      try {
        console.info(
          `[RepoLoader] Fetching live data for "${identifier}" from ${repo.name}...`,
        );

        // Always append timestamp query parameter to bypass browser caching and get fresh data
        const data = await loadScriptOrEval(
          `${targetUrl}?_t=${Date.now()}`,
          identifier,
        );

        console.info(
          `%c[RepoLoader] Successfully loaded "${identifier}" from ${repo.name}.`,
          "color: #2ecc71; font-weight: bold;",
        );
        return data;
      } catch (err) {
        console.warn(
          `[RepoLoader] ${repo.name} failed or unavailable. Switching to next repository...`,
          err,
        );
        lastError = err;
      }
    }

    throw new Error(
      `Critical Error: All repositories failed to provide "${identifier}". Details: ${lastError?.message}`,
    );
  }

  /**
   * Helper to dynamically inject script and extract assigned global variables
   */
  function loadScriptOrEval(url, identifier) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = url;
      script.async = true;

      script.onload = () => {
        script.remove(); // Clean up script tag immediately after reading variables

        let extractedData = null;
        if (
          identifier === "redeem-codes" &&
          typeof redeemCodesData !== "undefined"
        ) {
          extractedData = redeemCodesData;
        } else if (identifier === "test-server") {
          extractedData = {
            testServerData:
              typeof testServerData !== "undefined" ? testServerData : null,
            notARobot: typeof notARobot !== "undefined" ? notARobot : null,
          };
        }

        if (extractedData !== null) {
          resolve(extractedData);
        } else {
          reject(
            new Error(
              "Target global data variable not defined after script load.",
            ),
          );
        }
      };

      script.onerror = () => {
        script.remove();
        reject(new Error(`Network error loading script from ${url}`));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * TEST & DEBUG FUNCTION
   * Run this in your browser console to test fetching and print out the loaded data.
   * Example: testRepoFetch("redeem-codes")
   * 
    testRepoFetch("redeem-codes")
    testRepoFetch("test-server")

   */
  window.testRepoFetch = async function (identifier = "redeem-codes") {
    console.group(
      `%c[RepoLoader Test] Live Fetch Test for: "${identifier}"`,
      "color: #38bdf8; font-weight: bold;",
    );
    const startTime = performance.now();
    try {
      const data = await fetchSharedData(identifier);
      const endTime = performance.now();

      console.log(
        `%c[Success] Fetched live data in ${(endTime - startTime).toFixed(2)}ms`,
        "color: #2ecc71; font-weight: bold;",
      );
      console.log(
        "%c--- PRINTING LOADED DATA BELOW ---",
        "color: #f1f5f9; background: #1e293b; padding: 4px; font-weight: bold;",
      );
      console.log(data);
      console.log(
        "%c----------------------------------",
        "color: #f1f5f9; background: #1e293b; padding: 4px; font-weight: bold;",
      );
    } catch (error) {
      console.error(
        "%c[Test Error] Failed to load data:",
        "color: #e74c3c; font-weight: bold;",
        error,
      );
    }
    console.groupEnd();
  };

  // Expose universal loader globally
  window.loadSharedData = fetchSharedData;
})(window);
