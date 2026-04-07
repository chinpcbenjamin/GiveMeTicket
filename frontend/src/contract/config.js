import TicketingPlatformArtifact from "../../../artifacts/contracts/TicketingPlatform.sol/TicketingPlatform.json";
import MarketplaceArtifact from "../../../artifacts/contracts/Marketplace.sol/Marketplace.json";

let _cachedAddresses = null;
async function loadAddresses() {
	if (_cachedAddresses) return _cachedAddresses;
	try {
		// fetch from public folder so dev server serves the latest JSON without rebuild
		const resp = await fetch('/contract/deployed-addresses.json');
		if (!resp.ok) throw new Error('Failed to fetch deployed-addresses.json');
		_cachedAddresses = await resp.json();
		return _cachedAddresses;
	} catch (err) {
		// fallback to trying to import statically (works at build-time)
		try {
			// dynamic import of JSON will be bundled by Vite at build time
			const mod = await import('./deployed-addresses.json');
			_cachedAddresses = mod.default || mod;
			return _cachedAddresses;
		} catch (e) {
			console.error('Unable to load deployed addresses:', e);
			throw err;
		}
	}
}

export async function getTicketingPlatformAddress() {
	const a = await loadAddresses();
	return a.ticketingPlatform;
}

export async function getMarketplaceAddress() {
	const a = await loadAddresses();
	return a.marketplace;
}

export const TICKETING_PLATFORM_ABI = TicketingPlatformArtifact.abi;
export const MARKETPLACE_ABI = MarketplaceArtifact.abi;
