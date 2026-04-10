import TicketingPlatformArtifact from "../../../artifacts/contracts/TicketingPlatform.sol/TicketingPlatform.json";
import MarketplaceArtifact from "../../../artifacts/contracts/Marketplace.sol/Marketplace.json";

async function loadAddresses() {
	try {
		const resp = await fetch('/contract/deployed-addresses.json', {
			cache: 'no-store',
		});
		if (!resp.ok) throw new Error('Failed to fetch deployed-addresses.json');
		return await resp.json();
	} catch (err) {
		try {
			const mod = await import('./deployed-addresses.json');
			return mod.default || mod;
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
