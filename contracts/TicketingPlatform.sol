// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ITicketingPlatform.sol";

// ERC-721 event ticketing contract. Each ticket is a unique NFT. Implements ITicketingPlatform
contract TicketingPlatform is ERC721Enumerable, ReentrancyGuard, Ownable, ITicketingPlatform {

    enum TicketStatus { Valid, Used, Resale, Cancelled }
    enum EventStatus  { Active, Ended, Cancelled }

    struct Event {
        string      name;
        uint256     date;
        uint256     totalSupply;
        uint256     ticketsSold;
        uint256     facePrice;
        uint256     resaleCapBps; 
        EventStatus status;
        uint256     resaleCommissionBps;
        uint256     createdAt;
    }

    struct Ticket {
        uint256      eventId;
        uint256      facePrice;
        TicketStatus status;
    }

    mapping(uint256 => Event)  public events;
    mapping(uint256 => Ticket) public tickets;
    uint256 public nextEventId;
    uint256 public nextTokenId;

    address public marketplace;
    mapping(address => uint256) public pendingRefunds;
    uint256 public totalPendingRefunds;

    event EventCreated(uint256 indexed eventId, string name, uint256 facePrice);
    event TicketMinted(uint256 indexed tokenId, uint256 indexed eventId, address buyer);
    event EventCancelled(uint256 indexed eventId);
    event EventEnded(uint256 indexed eventId);
    event TicketUsed(uint256 indexed tokenId);
    event MarketplaceSet(address indexed marketplace);
    event TicketStatusChanged(uint256 indexed tokenId, TicketStatus status);
    event Withdrawn(address indexed recipient, uint256 amount);
    event RefundCredited(uint256 indexed tokenId, address indexed buyer, uint256 amount);
    event RefundClaimed(address indexed buyer, uint256 amount);

    modifier onlyMarketplace() {
        require(msg.sender == marketplace, "Caller is not the marketplace");
        _;
    }

    constructor() ERC721("GiveMeTicket", "GMT") {}

    function createEvent(
        string memory name,
        uint256 date,
        uint256 totalSupply,
        uint256 facePrice,
        uint256 resaleCapBps,
        uint256 resaleCommissionBps
    ) external onlyOwner returns (uint256 eventId) {
        require(bytes(name).length > 0,  "Event name cannot be empty");
        require(date > block.timestamp, "Event date must be in the future");
        require(totalSupply > 0,        "Total supply must be > 0");
        require(facePrice > 0,          "Face price must be > 0");
        require(resaleCapBps >= 10_000 + resaleCommissionBps, "Resale cap must cover face price + commission");
        require(resaleCommissionBps >= 0, "Resale commission must be >= 0");
        require(resaleCommissionBps <= 10_000, "Resale commission must be <= 100% (10000 bps)");

        eventId = nextEventId++;
        events[eventId] = Event({
            name:         name,
            date:         date,
            totalSupply:  totalSupply,
            ticketsSold:  0,
            facePrice:    facePrice,
            resaleCapBps: resaleCapBps,
            status:       EventStatus.Active,
            resaleCommissionBps: resaleCommissionBps,
            createdAt:    block.timestamp
        });

        emit EventCreated(eventId, name, facePrice);
    }

    // Cancels an active event; freezes all ticket transfers. Only owner.
    function cancelEvent(uint256 eventId) external onlyOwner {
        require(events[eventId].status == EventStatus.Active, "Event is not active");
        events[eventId].status = EventStatus.Cancelled;
        emit EventCancelled(eventId);
    }

    // Marks an active event as Ended; freezes all ticket transfers. Only owner.
    function markEventEnded(uint256 eventId) external onlyOwner {
        require(events[eventId].status == EventStatus.Active, "Event is not active");
        events[eventId].status = EventStatus.Ended;
        emit EventEnded(eventId);
    }

    // Marks a ticket as Used at the venue gate. Only owner.
    function markTicketUsed(uint256 tokenId) external onlyOwner {
        require(_ownerOf(tokenId) != address(0),              "Ticket does not exist");
        require(tickets[tokenId].status == TicketStatus.Valid, "Ticket is not Valid");
        tickets[tokenId].status = TicketStatus.Used;
        emit TicketUsed(tokenId);
    }

    // Sets the marketplace contract address. Only owner.
    function setMarketplace(address _marketplace) external onlyOwner {
        require(_marketplace != address(0), "Invalid marketplace address");
        marketplace = _marketplace;
        emit MarketplaceSet(_marketplace);
    }

    // Accepts ETH (e.g. resale commission from Marketplace).
    receive() external payable {}

    // Withdraws the full contract ETH balance to the owner. Only owner.
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        uint256 available = balance - totalPendingRefunds;
        require(available > 0, "No withdrawable funds");
        (bool success, ) = owner().call{value: available}("");
        require(success, "ETH transfer failed");
        emit Withdrawn(owner(), available);
    }

    function buyTicket(uint256 eventId)
        external
        payable
        nonReentrant
        returns (uint256 tokenId)
    {
        Event storage evt = events[eventId];
        require(msg.sender != owner(), "Organizer cannot buy tickets");

        require(evt.status == EventStatus.Active, "Event is not active");
        require(block.timestamp < evt.date,        "Event has already started");
        require(evt.ticketsSold < evt.totalSupply, "Event is sold out");
        require(msg.value == evt.facePrice,        "Incorrect payment amount");

        tokenId = nextTokenId++;
        evt.ticketsSold++;
        tickets[tokenId] = Ticket({
            eventId:   eventId,
            facePrice: evt.facePrice,
            status:    TicketStatus.Valid
        });

        _safeMint(msg.sender, tokenId);
        emit TicketMinted(tokenId, eventId, msg.sender);
    }
    // Claims a refund for a ticket belonging to a cancelled event.
    // Ticket must be Valid (not in escrow) — if it is listed on the marketplace
    function claimRefund(uint256 tokenId) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender,                "Not the ticket owner");
        require(tickets[tokenId].status == TicketStatus.Valid, "Ticket must be Valid");
        require(events[tickets[tokenId].eventId].status == EventStatus.Cancelled, "Event is not cancelled");

        uint256 refundAmount = tickets[tokenId].facePrice;
        tickets[tokenId].status = TicketStatus.Cancelled;

        pendingRefunds[msg.sender] += refundAmount;
        totalPendingRefunds += refundAmount;
        emit RefundCredited(tokenId, msg.sender, refundAmount);
    }

    function withdrawRefund() external nonReentrant {
        uint256 amount = pendingRefunds[msg.sender];
        require(amount > 0, "No refund available");
        pendingRefunds[msg.sender] = 0;
        totalPendingRefunds -= amount;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Refund transfer failed");
        emit RefundClaimed(msg.sender, amount);
    }

    function getResaleCap(uint256 tokenId) external view override returns (uint256) {
        Ticket storage ticket = tickets[tokenId];
        Event  storage evt    = events[ticket.eventId];

        uint256 timeTotal = evt.date - evt.createdAt;
        uint256 timeLeft  = block.timestamp >= evt.date
            ? 0
            : evt.date - block.timestamp;

        uint256 floorBps = 10_000 + evt.resaleCommissionBps;
        uint256 markup   = evt.resaleCapBps - floorBps;
        uint256 currentCapBps = floorBps + markup * timeLeft * timeLeft / (timeTotal * timeTotal);

        return ticket.facePrice * currentCapBps / 10_000;
    }

    function getTicketPrice(uint256 tokenId) external view override returns (uint256) {
        return tickets[tokenId].facePrice;
    }

    function isTicketValid(uint256 tokenId) external view override returns (bool) {
        Ticket storage ticket = tickets[tokenId];
        return ticket.status == TicketStatus.Valid
            && events[ticket.eventId].status == EventStatus.Active;
    }

    // Sets a ticket status to Resale when it enters marketplace escrow. Only marketplace.
    function setTicketToResale(uint256 tokenId) external onlyMarketplace {
        require(tickets[tokenId].status == TicketStatus.Valid, "Ticket is not Valid");
        tickets[tokenId].status = TicketStatus.Resale;
        emit TicketStatusChanged(tokenId, TicketStatus.Resale);
    }

    function setTicketToValid(uint256 tokenId) external onlyMarketplace {
        require(tickets[tokenId].status == TicketStatus.Resale, "Ticket is not in Resale");
        tickets[tokenId].status = TicketStatus.Valid;
        emit TicketStatusChanged(tokenId, TicketStatus.Valid);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal override(ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);

        // Skip checks for mints (from == 0) and marketplace escrow releases (from == marketplace)
        if (from != address(0) && from != marketplace) {
            for (uint256 i = 0; i < batchSize; i++) {
                uint256 tokenId = firstTokenId + i;
                Ticket storage ticket = tickets[tokenId];
                Event  storage evt    = events[ticket.eventId];

                require(evt.status == EventStatus.Active,   "Transfer blocked: event is not Active");
                require(block.timestamp < evt.date,          "Transfer blocked: event date has passed");
                require(ticket.status == TicketStatus.Valid, "Transfer blocked: ticket is not Valid");
            }
        }
    }
}
