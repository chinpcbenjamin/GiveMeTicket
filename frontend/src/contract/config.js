import TicketingPlatformArtifact from "../../../artifacts/contracts/TicketingPlatform.sol/TicketingPlatform.json";

export const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // TODO: replace with deployed address

const ensureResellFragment = {
  name: "resellTicket",
  type: "function",
  inputs: [
    { name: "ticketId", type: "uint256" },
    { name: "price", type: "uint256" },
  ],
  outputs: [],
  stateMutability: "nonpayable",
};

const hasResellFragment = TicketingPlatformArtifact.abi.some(
  (fragment) => fragment.type === "function" && fragment.name === "resellTicket",
);

export const ABI = hasResellFragment
  ? TicketingPlatformArtifact.abi
  : [...TicketingPlatformArtifact.abi, ensureResellFragment];
