import TicketingPlatformArtifact from "../../../artifacts/contracts/TicketingPlatform.sol/TicketingPlatform.json";
import MarketplaceArtifact from "../../../artifacts/contracts/Marketplace.sol/Marketplace.json";
import addresses from "./deployed-addresses.json";

export const TICKETING_PLATFORM_ADDRESS = addresses.ticketingPlatform;
export const MARKETPLACE_ADDRESS = addresses.marketplace;

export const TICKETING_PLATFORM_ABI = TicketingPlatformArtifact.abi;
export const MARKETPLACE_ABI = MarketplaceArtifact.abi;
