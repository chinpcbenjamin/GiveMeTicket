// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./TicketingPlatform.sol";

// Resale marketplace for GiveMeTicket NFT tickets.
// Sellers escrow their NFT here; ETH goes directly to the seller on purchase.
// Must be registered via TicketingPlatform.setMarketplace() before use.
contract Marketplace is ReentrancyGuard {
    using EnumerableSet for EnumerableSet.UintSet;

    TicketingPlatform public immutable ticketing;

    struct ResaleListing {
        address seller;
        uint256 price;
    }

    mapping(uint256 => ResaleListing) public resaleListings;
    EnumerableSet.UintSet private _activeListings;

    event TicketListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event ResaleTicketSold(uint256 indexed tokenId, address indexed buyer, uint256 price, uint256 commission, uint256 sellerProceeds);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);

    constructor(address payable _ticketing) {
        require(_ticketing != address(0), "Invalid ticketing address");
        ticketing = TicketingPlatform(_ticketing);
    }

    // Lists a ticket for resale. Seller must call TicketingPlatform.approve(marketplace, tokenId) first.
    function listTicket(uint256 tokenId, uint256 price) external nonReentrant {
        require(ticketing.ownerOf(tokenId) == msg.sender, "Not ticket owner");
        require(price > 0,                                "Price must be > 0");

        (uint256 eventId, , TicketingPlatform.TicketStatus ticketStatus) = ticketing.tickets(tokenId);
        require(ticketStatus == TicketingPlatform.TicketStatus.Valid, "Ticket not Valid");

        (, , , , , , TicketingPlatform.EventStatus eventStatus, , ) = ticketing.events(eventId);
        require(eventStatus == TicketingPlatform.EventStatus.Active,  "Event not active");

        require(price <= ticketing.getResaleCap(tokenId), "Price exceeds resale cap");

        // Effects
        resaleListings[tokenId] = ResaleListing({ seller: msg.sender, price: price });
        _activeListings.add(tokenId);

        // Interactions
        ticketing.transferFrom(msg.sender, address(this), tokenId);
        require(ticketing.ownerOf(tokenId) == address(this), "Escrow transfer failed");
        ticketing.setTicketToResale(tokenId);

        emit TicketListed(tokenId, msg.sender, price);
    }

    // Buys a resale-listed ticket. Splits ETH between seller and TicketingPlatform (commission).
    function buyResaleTicket(uint256 tokenId) external payable nonReentrant {
        ResaleListing memory listing = resaleListings[tokenId];
        require(listing.seller != address(0), "No active listing");
        require(msg.value == listing.price,   "Incorrect payment amount");

        address seller = listing.seller;
        uint256 price  = listing.price;

        (uint256 eventId, , ) = ticketing.tickets(tokenId);
        (, , , , , , , uint256 commissionBps, ) = ticketing.events(eventId);
        uint256 commission = price * commissionBps / 10000;
        uint256 sellerProceeds = price - commission;

        // sanity check
        require(commission + sellerProceeds == price, "Math error in payout split");

        // Effects
        delete resaleListings[tokenId];
        _activeListings.remove(tokenId);

        // Interactions
        ticketing.setTicketToValid(tokenId);
        ticketing.transferFrom(address(this), msg.sender, tokenId);
        require(ticketing.ownerOf(tokenId) == msg.sender, "NFT transfer to buyer failed");

        if (commission > 0) {
            (bool commissionOk, ) = address(ticketing).call{value: commission}("");
            require(commissionOk, "Commission transfer failed");
        }

        (bool sellerOk, ) = seller.call{value: sellerProceeds}("");
        require(sellerOk, "Seller transfer failed");

        emit ResaleTicketSold(tokenId, msg.sender, price, commission, sellerProceeds);
    }

    // Cancels a listing and returns the ticket from escrow to the seller.
    function cancelListing(uint256 tokenId) external nonReentrant {
        ResaleListing memory listing = resaleListings[tokenId];
        require(listing.seller == msg.sender, "Not the seller");

        // Effects
        delete resaleListings[tokenId];
        _activeListings.remove(tokenId);

        // Interactions
        ticketing.setTicketToValid(tokenId);
        ticketing.transferFrom(address(this), msg.sender, tokenId);

        emit ListingCancelled(tokenId, msg.sender);
    }

    // Returns the number of active resale listings.
    function getActiveListingCount() external view returns (uint256) {
        return _activeListings.length();
    }

    // Returns the token ID of the active listing at a given index.
    function getActiveListingAt(uint256 index) external view returns (uint256) {
        return _activeListings.at(index);
    }
}
