export const CONTRACT_ADDRESS = "0xYourContractAddressHere"; // we need to edit this

export const ABI = [
  "function getResaleCap(uint256 tokenId) view returns (uint256)",
  "function getTicketPrice(uint256 tokenId) view returns (uint256)",
  "function isTicketValid(uint256 tokenId) view returns (bool)",
];