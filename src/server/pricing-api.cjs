async function handlePricingApi({ method, config, store }) {
  try {
    const body = method === "POST"
      ? await store.sync(config)
      : await store.get(config);
    return {
      status: 200,
      body: {
        ...body,
        sync: {
          ...body.sync,
          syncOnStartup: config.googleSheetSyncOnStartup !== false
        }
      }
    };
  } catch (error) {
    return {
      status: 503,
      body: {
        error: error.message,
        sync: {
          source: "unavailable",
          ownerEmail: config.googleSheetOwnerEmail,
          spreadsheetId: config.googleSheetId,
          syncedAt: null,
          warning: error.message
        }
      }
    };
  }
}

module.exports = { handlePricingApi };
