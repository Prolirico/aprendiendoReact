let universityDomainsCache = null;
let lastCacheUpdate = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

exports.getDomainsCache = () => ({
  universityDomainsCache,
  lastCacheUpdate,
});

exports.setDomainsCache = (domains) => {
  universityDomainsCache = domains;
  lastCacheUpdate = Date.now();
  console.log("setDomainsCache: Domains cached:", universityDomainsCache);
};

exports.clearDomainCache = () => {
  universityDomainsCache = null;
  lastCacheUpdate = null;
  console.log("clearDomainCache: Domain cache invalidated");
};

exports.CACHE_DURATION = CACHE_DURATION;
