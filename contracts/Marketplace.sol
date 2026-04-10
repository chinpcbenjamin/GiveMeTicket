// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./TicketingPlatform.sol";

contract Marketplace is ReentrancyGuard {
    using EnumerableSet for EnumerableSet.UintSet;

    TicketingPlatform public immutable ticketing;

    struct ResaleListing {
        address seller;
    }

    mapping(uint256 => ResaleListing) public resaleListings;
    EnumerableSet.UintSet private _activeListings;
    mapping(address => uint256) public pendingWithdrawals;

    event TicketListed(uint256 indexed tokenId, address indexed seller);
    event ResaleTicketSold(uint256 indexed tokenId, address indexed buyer, uint256 price, uint256 commission, uint256 sellerProceeds);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    event ProceedsCredited(address indexed seller, uint256 amount);
    event ProceedsClaimed(address indexed seller, uint256 amount);

    constructor(address payable _ticketing) {
        require(_ticketing != address(0), "Invalid ticketing address");
        ticketing = TicketingPlatform(_ticketing);
    }

    function listTicket(uint256 tokenId) external nonReentrant {
        require(ticketing.ownerOf(tokenId) == msg.sender, "Not ticket owner");

        (uint256 eventId, , TicketingPlatform.TicketStatus ticketStatus) = ticketing.tickets(tokenId);
        require(ticketStatus == TicketingPlatform.TicketStatus.Valid, "Ticket not Valid");

        (, , , , , , TicketingPlatform.EventStatus eventStatus, , ) = ticketing.events(eventId);
        require(eventStatus == TicketingPlatform.EventStatus.Active,  "Event not active");

        resaleListings[tokenId] = ResaleListing({ seller: msg.sender });
        _activeListings.add(tokenId);

        ticketing.transferFrom(msg.sender, address(this), tokenId);
        require(ticketing.ownerOf(tokenId) == address(this), "Escrow transfer failed");
        ticketing.setTicketToResale(tokenId);

        emit TicketListed(tokenId, msg.sender);
    }

    function buyResaleTicket(uint256 tokenId) external payable nonReentrant {
        require(msg.sender != ticketing.owner(), "Organizer cannot buy resale tickets");

        ResaleListing memory listing = resaleListings[tokenId];
        require(listing.seller != address(0), "No active listing");

        uint256 price = ticketing.getResaleCap(tokenId);
        require(msg.value >= price, "Payment below current resale price");

        address seller = listing.seller;

        (uint256 eventId, , ) = ticketing.tickets(tokenId);
        (, , , , , , , uint256 commissionBps, ) = ticketing.events(eventId);
        uint256 commission = price * commissionBps / 10000;
        uint256 sellerProceeds = price - commission;

        require(commission + sellerProceeds == price, "Math error in payout split");

        delete resaleListings[tokenId];
        _activeListings.remove(tokenId);

        pendingWithdrawals[seller] += sellerProceeds;
        emit ProceedsCredited(seller, sellerProceeds);

        ticketing.setTicketToValid(tokenId);
        ticketing.transferFrom(address(this), msg.sender, tokenId);
        require(ticketing.ownerOf(tokenId) == msg.sender, "NFT transfer to buyer failed");

        if (commission > 0) {
            (bool commissionOk, ) = address(ticketing).call{value: commission}("");
            require(commissionOk, "Commission transfer failed");
        }

        uint256 excess = msg.value - price;
        if (excess > 0) {
            (bool refundOk, ) = msg.sender.call{value: excess}("");
            require(refundOk, "Excess refund failed");
        }

        emit ResaleTicketSold(tokenId, msg.sender, price, commission, sellerProceeds);
    }

    function claimProceeds() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No proceeds to claim");

        pendingWithdrawals[msg.sender] = 0;

        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Proceeds transfer failed");

        emit ProceedsClaimed(msg.sender, amount);
    }

    function cancelListing(uint256 tokenId) external nonReentrant {
        ResaleListing memory listing = resaleListings[tokenId];
        require(listing.seller == msg.sender, "Not the seller");

        delete resaleListings[tokenId];
        _activeListings.remove(tokenId);

        ticketing.setTicketToValid(tokenId);
        ticketing.transferFrom(address(this), msg.sender, tokenId);

        emit ListingCancelled(tokenId, msg.sender);
    }

    function getActiveListingCount() external view returns (uint256) {
        return _activeListings.length();
    }

    function getActiveListingAt(uint256 index) external view returns (uint256) {
        return _activeListings.at(index);
    }
}
