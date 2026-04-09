const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

async function deployFixture() {
    const [owner, buyer1, buyer2] = await ethers.getSigners();

    const TicketingPlatform = await ethers.getContractFactory("TicketingPlatform");
    const ticketing = await TicketingPlatform.deploy();
    await ticketing.waitForDeployment();

    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplace = await Marketplace.deploy(await ticketing.getAddress());
    await marketplace.waitForDeployment();

    await ticketing.setMarketplace(await marketplace.getAddress());

    return { ticketing, marketplace, owner, buyer1, buyer2 };
}

async function deployWithEventFixture() {
    const base = await deployFixture();
    const { ticketing } = base;

    const now = await time.latest();
    const eventDate = now + 7 * 24 * 3600;

    await ticketing.createEvent(
        "Test Concert",
        eventDate,
        100,
        ethers.parseEther("1"),
        20_000,
        500
    );

    return { ...base, eventDate, eventId: 0 };
}

async function deployWithTicketFixture() {
    const base = await deployWithEventFixture();
    const { ticketing, buyer1, eventId } = base;

    await ticketing.connect(buyer1).buyTicket(eventId, { value: ethers.parseEther("1") });

    return { ...base, tokenId: 0 };
}

async function deployWithListingFixture() {
    const base = await deployWithTicketFixture();
    const { ticketing, marketplace, buyer1, tokenId } = base;

    await ticketing.connect(buyer1).approve(await marketplace.getAddress(), tokenId);
    await marketplace.connect(buyer1).listTicket(tokenId, ethers.parseEther("1"));

    return base;
}

describe("TicketingPlatform", function () {

    describe("createEvent", function () {
        it("stores event fields correctly", async function () {
            const { ticketing } = await loadFixture(deployWithEventFixture);
            const evt = await ticketing.events(0);
            expect(evt.name).to.equal("Test Concert");
            expect(evt.totalSupply).to.equal(100n);
            expect(evt.facePrice).to.equal(ethers.parseEther("1"));
            expect(evt.resaleCapBps).to.equal(20_000n);
            expect(evt.resaleCommissionBps).to.equal(500n);
            expect(evt.ticketsSold).to.equal(0n);
            expect(evt.status).to.equal(0);
        });

        it("emits EventCreated", async function () {
            const { ticketing } = await loadFixture(deployFixture);
            const now = await time.latest();
            await expect(
                ticketing.createEvent("Concert", now + 3600, 50, ethers.parseEther("0.5"), 10_000, 0)
            ).to.emit(ticketing, "EventCreated").withArgs(0, "Concert", ethers.parseEther("0.5"));
        });

        it("reverts when date is not in the future", async function () {
            const { ticketing } = await loadFixture(deployFixture);
            const now = await time.latest();
            await expect(
                ticketing.createEvent("Late", now - 1, 10, ethers.parseEther("1"), 10_000, 0)
            ).to.be.revertedWith("Event date must be in the future");
        });

        it("reverts when totalSupply is 0", async function () {
            const { ticketing } = await loadFixture(deployFixture);
            const now = await time.latest();
            await expect(
                ticketing.createEvent("Zero", now + 3600, 0, ethers.parseEther("1"), 10_000, 0)
            ).to.be.revertedWith("Total supply must be > 0");
        });

        it("reverts when facePrice is 0", async function () {
            const { ticketing } = await loadFixture(deployFixture);
            const now = await time.latest();
            await expect(
                ticketing.createEvent("Free", now + 3600, 10, 0, 10_000, 0)
            ).to.be.revertedWith("Face price must be > 0");
        });

        it("reverts when resaleCapBps is below 100%", async function () {
            const { ticketing } = await loadFixture(deployFixture);
            const now = await time.latest();
            await expect(
                ticketing.createEvent("Cap", now + 3600, 10, ethers.parseEther("1"), 9_999, 0)
            ).to.be.revertedWith("Resale cap must be >= 100% (10000 bps)");
        });

        it("reverts when resaleCommissionBps exceeds 100%", async function () {
            const { ticketing } = await loadFixture(deployFixture);
            const now = await time.latest();
            await expect(
                ticketing.createEvent("Comm", now + 3600, 10, ethers.parseEther("1"), 10_000, 10_001)
            ).to.be.revertedWith("Resale commission must be <= 100% (10000 bps)");
        });

        it("reverts when called by non-owner", async function () {
            const { ticketing, buyer1 } = await loadFixture(deployFixture);
            const now = await time.latest();
            await expect(
                ticketing.connect(buyer1).createEvent("X", now + 3600, 10, ethers.parseEther("1"), 10_000, 0)
            ).to.be.reverted;
        });
    });

    describe("buyTicket", function () {
        it("mints the NFT to the buyer", async function () {
            const { ticketing, buyer1, eventId } = await loadFixture(deployWithEventFixture);
            await ticketing.connect(buyer1).buyTicket(eventId, { value: ethers.parseEther("1") });
            expect(await ticketing.ownerOf(0)).to.equal(buyer1.address);
        });

        it("increments ticketsSold", async function () {
            const { ticketing, buyer1, eventId } = await loadFixture(deployWithEventFixture);
            await ticketing.connect(buyer1).buyTicket(eventId, { value: ethers.parseEther("1") });
            const evt = await ticketing.events(eventId);
            expect(evt.ticketsSold).to.equal(1n);
        });

        it("stores correct ticket metadata", async function () {
            const { ticketing, buyer1, eventId } = await loadFixture(deployWithEventFixture);
            await ticketing.connect(buyer1).buyTicket(eventId, { value: ethers.parseEther("1") });
            const ticket = await ticketing.tickets(0);
            expect(ticket.eventId).to.equal(BigInt(eventId));
            expect(ticket.facePrice).to.equal(ethers.parseEther("1"));
            expect(ticket.status).to.equal(0);
        });

        it("emits TicketMinted", async function () {
            const { ticketing, buyer1, eventId } = await loadFixture(deployWithEventFixture);
            await expect(
                ticketing.connect(buyer1).buyTicket(eventId, { value: ethers.parseEther("1") })
            ).to.emit(ticketing, "TicketMinted").withArgs(0, eventId, buyer1.address);
        });

        it("ETH stays in contract", async function () {
            const { ticketing, buyer1, eventId } = await loadFixture(deployWithEventFixture);
            await ticketing.connect(buyer1).buyTicket(eventId, { value: ethers.parseEther("1") });
            expect(await ethers.provider.getBalance(await ticketing.getAddress()))
                .to.equal(ethers.parseEther("1"));
        });

        it("reverts when organizer tries to buy their own ticket", async function () {
            const { ticketing, owner, eventId } = await loadFixture(deployWithEventFixture);
            await expect(
                ticketing.connect(owner).buyTicket(eventId, { value: ethers.parseEther("1") })
            ).to.be.revertedWith("Organizer cannot buy tickets");
        });

        it("reverts when payment is incorrect", async function () {
            const { ticketing, buyer1, eventId } = await loadFixture(deployWithEventFixture);
            await expect(
                ticketing.connect(buyer1).buyTicket(eventId, { value: ethers.parseEther("0.5") })
            ).to.be.revertedWith("Incorrect payment amount");
        });

        it("reverts when event is sold out", async function () {
            const { ticketing, buyer1, buyer2 } = await loadFixture(deployFixture);
            const now = await time.latest();
            await ticketing.createEvent("Tiny", now + 3600, 1, ethers.parseEther("1"), 10_000, 0);
            await ticketing.connect(buyer1).buyTicket(0, { value: ethers.parseEther("1") });
            await expect(
                ticketing.connect(buyer2).buyTicket(0, { value: ethers.parseEther("1") })
            ).to.be.revertedWith("Event is sold out");
        });

        it("reverts when event has been cancelled", async function () {
            const { ticketing, buyer1, eventId } = await loadFixture(deployWithEventFixture);
            await ticketing.cancelEvent(eventId);
            await expect(
                ticketing.connect(buyer1).buyTicket(eventId, { value: ethers.parseEther("1") })
            ).to.be.revertedWith("Event is not active");
        });

        it("reverts when event date has already passed", async function () {
            const { ticketing, buyer1, eventDate, eventId } = await loadFixture(deployWithEventFixture);
            await time.increaseTo(eventDate + 1);
            await expect(
                ticketing.connect(buyer1).buyTicket(eventId, { value: ethers.parseEther("1") })
            ).to.be.revertedWith("Event has already started");
        });
    });

    describe("cancelEvent", function () {
        it("sets event status to Cancelled", async function () {
            const { ticketing, eventId } = await loadFixture(deployWithEventFixture);
            await ticketing.cancelEvent(eventId);
            const evt = await ticketing.events(eventId);
            expect(evt.status).to.equal(2);
        });

        it("emits EventCancelled", async function () {
            const { ticketing, eventId } = await loadFixture(deployWithEventFixture);
            await expect(ticketing.cancelEvent(eventId))
                .to.emit(ticketing, "EventCancelled").withArgs(eventId);
        });

        it("reverts when called by non-owner", async function () {
            const { ticketing, buyer1, eventId } = await loadFixture(deployWithEventFixture);
            await expect(ticketing.connect(buyer1).cancelEvent(eventId)).to.be.reverted;
        });

        it("reverts when event is already cancelled", async function () {
            const { ticketing, eventId } = await loadFixture(deployWithEventFixture);
            await ticketing.cancelEvent(eventId);
            await expect(ticketing.cancelEvent(eventId)).to.be.revertedWith("Event is not active");
        });
    });

    describe("markEventEnded", function () {
        it("sets event status to Ended", async function () {
            const { ticketing, eventId } = await loadFixture(deployWithEventFixture);
            await ticketing.markEventEnded(eventId);
            const evt = await ticketing.events(eventId);
            expect(evt.status).to.equal(1);
        });

        it("emits EventEnded", async function () {
            const { ticketing, eventId } = await loadFixture(deployWithEventFixture);
            await expect(ticketing.markEventEnded(eventId))
                .to.emit(ticketing, "EventEnded").withArgs(eventId);
        });

        it("reverts when called by non-owner", async function () {
            const { ticketing, buyer1, eventId } = await loadFixture(deployWithEventFixture);
            await expect(ticketing.connect(buyer1).markEventEnded(eventId)).to.be.reverted;
        });

        it("reverts when event is already ended", async function () {
            const { ticketing, eventId } = await loadFixture(deployWithEventFixture);
            await ticketing.markEventEnded(eventId);
            await expect(ticketing.markEventEnded(eventId)).to.be.revertedWith("Event is not active");
        });
    });

    describe("markTicketUsed", function () {
        it("sets ticket status to Used and emits TicketUsed", async function () {
            const { ticketing, tokenId } = await loadFixture(deployWithTicketFixture);
            await expect(ticketing.markTicketUsed(tokenId))
                .to.emit(ticketing, "TicketUsed").withArgs(tokenId);
            const ticket = await ticketing.tickets(tokenId);
            expect(ticket.status).to.equal(1);
        });

        it("reverts when called by non-owner", async function () {
            const { ticketing, buyer1, tokenId } = await loadFixture(deployWithTicketFixture);
            await expect(ticketing.connect(buyer1).markTicketUsed(tokenId)).to.be.reverted;
        });

        it("reverts when ticket is not Valid", async function () {
            const { ticketing, tokenId } = await loadFixture(deployWithTicketFixture);
            await ticketing.markTicketUsed(tokenId);
            await expect(ticketing.markTicketUsed(tokenId)).to.be.revertedWith("Ticket is not Valid");
        });
    });

    describe("getResaleCap", function () {
        it("returns approximately resaleCapBps % of facePrice right after event creation", async function () {
            const { ticketing, tokenId } = await loadFixture(deployWithTicketFixture);
            const cap = await ticketing.getResaleCap(tokenId);
            expect(cap).to.be.gt(ethers.parseEther("1.9"));
            expect(cap).to.be.lte(ethers.parseEther("2"));
        });

        it("returns exactly facePrice when the event date is reached", async function () {
            const { ticketing, tokenId, eventDate } = await loadFixture(deployWithTicketFixture);
            await time.increaseTo(eventDate);
            const cap = await ticketing.getResaleCap(tokenId);
            expect(cap).to.equal(ethers.parseEther("1"));
        });
    });

    describe("isTicketValid", function () {
        it("returns true for a valid ticket on an active event", async function () {
            const { ticketing, tokenId } = await loadFixture(deployWithTicketFixture);
            expect(await ticketing.isTicketValid(tokenId)).to.be.true;
        });

        it("returns false after event is cancelled", async function () {
            const { ticketing, tokenId, eventId } = await loadFixture(deployWithTicketFixture);
            await ticketing.cancelEvent(eventId);
            expect(await ticketing.isTicketValid(tokenId)).to.be.false;
        });

        it("returns false after ticket is marked Used", async function () {
            const { ticketing, tokenId } = await loadFixture(deployWithTicketFixture);
            await ticketing.markTicketUsed(tokenId);
            expect(await ticketing.isTicketValid(tokenId)).to.be.false;
        });
    });

    describe("transfer restrictions", function () {
        it("blocks direct peer-to-peer transfer when event is cancelled", async function () {
            const { ticketing, buyer1, buyer2, tokenId, eventId } = await loadFixture(deployWithTicketFixture);
            await ticketing.cancelEvent(eventId);
            await expect(
                ticketing.connect(buyer1).transferFrom(buyer1.address, buyer2.address, tokenId)
            ).to.be.revertedWith("Transfer blocked: event is not Active");
        });

        it("blocks direct peer-to-peer transfer when event date has passed", async function () {
            const { ticketing, buyer1, buyer2, tokenId, eventDate } = await loadFixture(deployWithTicketFixture);
            await time.increaseTo(eventDate + 1);
            await expect(
                ticketing.connect(buyer1).transferFrom(buyer1.address, buyer2.address, tokenId)
            ).to.be.revertedWith("Transfer blocked: event date has passed");
        });

        it("blocks direct transfer of a Used ticket", async function () {
            const { ticketing, buyer1, buyer2, tokenId } = await loadFixture(deployWithTicketFixture);
            await ticketing.markTicketUsed(tokenId);
            await expect(
                ticketing.connect(buyer1).transferFrom(buyer1.address, buyer2.address, tokenId)
            ).to.be.revertedWith("Transfer blocked: ticket is not Valid");
        });
    });
});

describe("Marketplace", function () {

    describe("listTicket", function () {
        it("transfers NFT into escrow and marks ticket as Resale", async function () {
            const { ticketing, marketplace, buyer1, tokenId } = await loadFixture(deployWithTicketFixture);
            const mpAddr = await marketplace.getAddress();

            await ticketing.connect(buyer1).approve(mpAddr, tokenId);
            await marketplace.connect(buyer1).listTicket(tokenId, ethers.parseEther("1"));

            expect(await ticketing.ownerOf(tokenId)).to.equal(mpAddr);
            const ticket = await ticketing.tickets(tokenId);
            expect(ticket.status).to.equal(2);
        });

        it("records the listing with seller and price", async function () {
            const { ticketing, marketplace, buyer1, tokenId } = await loadFixture(deployWithTicketFixture);
            await ticketing.connect(buyer1).approve(await marketplace.getAddress(), tokenId);
            await marketplace.connect(buyer1).listTicket(tokenId, ethers.parseEther("1.5"));

            const listing = await marketplace.resaleListings(tokenId);
            expect(listing.seller).to.equal(buyer1.address);
            expect(listing.price).to.equal(ethers.parseEther("1.5"));
        });

        it("emits TicketListed", async function () {
            const { ticketing, marketplace, buyer1, tokenId } = await loadFixture(deployWithTicketFixture);
            await ticketing.connect(buyer1).approve(await marketplace.getAddress(), tokenId);
            await expect(marketplace.connect(buyer1).listTicket(tokenId, ethers.parseEther("1")))
                .to.emit(marketplace, "TicketListed")
                .withArgs(tokenId, buyer1.address, ethers.parseEther("1"));
        });

        it("increments active listing count", async function () {
            const { ticketing, marketplace, buyer1, tokenId } = await loadFixture(deployWithTicketFixture);
            await ticketing.connect(buyer1).approve(await marketplace.getAddress(), tokenId);
            await marketplace.connect(buyer1).listTicket(tokenId, ethers.parseEther("1"));
            expect(await marketplace.getActiveListingCount()).to.equal(1n);
        });

        it("reverts when caller is not the ticket owner", async function () {
            const { ticketing, marketplace, buyer1, buyer2, tokenId } = await loadFixture(deployWithTicketFixture);
            await ticketing.connect(buyer1).approve(await marketplace.getAddress(), tokenId);
            await expect(
                marketplace.connect(buyer2).listTicket(tokenId, ethers.parseEther("1"))
            ).to.be.revertedWith("Not ticket owner");
        });

        it("reverts when price is 0", async function () {
            const { ticketing, marketplace, buyer1, tokenId } = await loadFixture(deployWithTicketFixture);
            await ticketing.connect(buyer1).approve(await marketplace.getAddress(), tokenId);
            await expect(
                marketplace.connect(buyer1).listTicket(tokenId, 0)
            ).to.be.revertedWith("Price must be > 0");
        });

        it("reverts when price exceeds the resale cap", async function () {
            const { ticketing, marketplace, buyer1, tokenId } = await loadFixture(deployWithTicketFixture);
            await ticketing.connect(buyer1).approve(await marketplace.getAddress(), tokenId);
            await expect(
                marketplace.connect(buyer1).listTicket(tokenId, ethers.parseEther("3"))
            ).to.be.revertedWith("Price exceeds resale cap");
        });

        it("reverts when event is not active", async function () {
            const { ticketing, marketplace, buyer1, tokenId, eventId } = await loadFixture(deployWithTicketFixture);
            await ticketing.cancelEvent(eventId);
            await ticketing.connect(buyer1).approve(await marketplace.getAddress(), tokenId);
            await expect(
                marketplace.connect(buyer1).listTicket(tokenId, ethers.parseEther("1"))
            ).to.be.revertedWith("Event not active");
        });
    });

    describe("buyResaleTicket", function () {
        it("transfers NFT to buyer and marks ticket as Valid", async function () {
            const { ticketing, marketplace, buyer2, tokenId } = await loadFixture(deployWithListingFixture);
            await marketplace.connect(buyer2).buyResaleTicket(tokenId, { value: ethers.parseEther("1") });

            expect(await ticketing.ownerOf(tokenId)).to.equal(buyer2.address);
            const ticket = await ticketing.tickets(tokenId);
            expect(ticket.status).to.equal(0);
        });

        it("splits ETH correctly: seller gets proceeds, platform gets commission", async function () {
            const { ticketing, marketplace, buyer1, buyer2, tokenId } = await loadFixture(deployWithListingFixture);
            const ticketingAddr = await ticketing.getAddress();
            const balanceBefore = await ethers.provider.getBalance(ticketingAddr);

            await marketplace.connect(buyer2).buyResaleTicket(tokenId, { value: ethers.parseEther("1") });

            expect(await marketplace.pendingWithdrawals(buyer1.address)).to.equal(ethers.parseEther("0.95"));

            await expect(
                marketplace.connect(buyer1).claimProceeds()
            ).to.changeEtherBalance(buyer1, ethers.parseEther("0.95"));

            const commissionReceived = (await ethers.provider.getBalance(ticketingAddr)) - balanceBefore;
            expect(commissionReceived).to.equal(ethers.parseEther("0.05"));
        });

        it("emits ResaleTicketSold with correct args", async function () {
            const { marketplace, buyer2, tokenId } = await loadFixture(deployWithListingFixture);
            await expect(
                marketplace.connect(buyer2).buyResaleTicket(tokenId, { value: ethers.parseEther("1") })
            ).to.emit(marketplace, "ResaleTicketSold")
                .withArgs(
                    tokenId,
                    buyer2.address,
                    ethers.parseEther("1"),
                    ethers.parseEther("0.05"),
                    ethers.parseEther("0.95")
                );
        });

        it("removes listing after purchase", async function () {
            const { marketplace, buyer2, tokenId } = await loadFixture(deployWithListingFixture);
            await marketplace.connect(buyer2).buyResaleTicket(tokenId, { value: ethers.parseEther("1") });

            const listing = await marketplace.resaleListings(tokenId);
            expect(listing.seller).to.equal(ethers.ZeroAddress);
            expect(await marketplace.getActiveListingCount()).to.equal(0n);
        });

        it("reverts when there is no active listing", async function () {
            const { marketplace, buyer2, tokenId } = await loadFixture(deployWithTicketFixture);
            await expect(
                marketplace.connect(buyer2).buyResaleTicket(tokenId, { value: ethers.parseEther("1") })
            ).to.be.revertedWith("No active listing");
        });

        it("reverts when payment amount is incorrect", async function () {
            const { marketplace, buyer2, tokenId } = await loadFixture(deployWithListingFixture);
            await expect(
                marketplace.connect(buyer2).buyResaleTicket(tokenId, { value: ethers.parseEther("0.5") })
            ).to.be.revertedWith("Incorrect payment amount");
        });
    });

    describe("cancelListing", function () {
        it("returns the NFT to the seller and marks ticket Valid", async function () {
            const { ticketing, marketplace, buyer1, tokenId } = await loadFixture(deployWithListingFixture);
            await marketplace.connect(buyer1).cancelListing(tokenId);

            expect(await ticketing.ownerOf(tokenId)).to.equal(buyer1.address);
            const ticket = await ticketing.tickets(tokenId);
            expect(ticket.status).to.equal(0);
        });

        it("removes the listing and decrements active count", async function () {
            const { marketplace, buyer1, tokenId } = await loadFixture(deployWithListingFixture);
            await marketplace.connect(buyer1).cancelListing(tokenId);

            const listing = await marketplace.resaleListings(tokenId);
            expect(listing.seller).to.equal(ethers.ZeroAddress);
            expect(await marketplace.getActiveListingCount()).to.equal(0n);
        });

        it("emits ListingCancelled", async function () {
            const { marketplace, buyer1, tokenId } = await loadFixture(deployWithListingFixture);
            await expect(marketplace.connect(buyer1).cancelListing(tokenId))
                .to.emit(marketplace, "ListingCancelled")
                .withArgs(tokenId, buyer1.address);
        });

        it("reverts when caller is not the seller", async function () {
            const { marketplace, buyer2, tokenId } = await loadFixture(deployWithListingFixture);
            await expect(marketplace.connect(buyer2).cancelListing(tokenId))
                .to.be.revertedWith("Not the seller");
        });
    });

    describe("getActiveListingAt", function () {
        it("returns the correct tokenId at the given index", async function () {
            const { marketplace, tokenId } = await loadFixture(deployWithListingFixture);
            expect(await marketplace.getActiveListingAt(0)).to.equal(BigInt(tokenId));
        });

        it("listing is gone after purchase", async function () {
            const { marketplace, buyer2, tokenId } = await loadFixture(deployWithListingFixture);
            await marketplace.connect(buyer2).buyResaleTicket(tokenId, { value: ethers.parseEther("1") });
            expect(await marketplace.getActiveListingCount()).to.equal(0n);
        });
    });
});

describe("claimRefund / withdrawRefund", function () {
    async function deployWithCancelledEventFixture() {
        const base = await deployWithTicketFixture();
        await base.ticketing.cancelEvent(base.eventId);
        return base;
    }

    it("credits facePrice to pendingRefunds", async function () {
        const { ticketing, buyer1, tokenId } = await loadFixture(deployWithCancelledEventFixture);
        await ticketing.connect(buyer1).claimRefund(tokenId);
        expect(await ticketing.pendingRefunds(buyer1.address)).to.equal(ethers.parseEther("1"));
    });

    it("marks ticket as Cancelled", async function () {
        const { ticketing, buyer1, tokenId } = await loadFixture(deployWithCancelledEventFixture);
        await ticketing.connect(buyer1).claimRefund(tokenId);
        const ticket = await ticketing.tickets(tokenId);
        expect(ticket.status).to.equal(3);
    });

    it("emits RefundCredited", async function () {
        const { ticketing, buyer1, tokenId } = await loadFixture(deployWithCancelledEventFixture);
        await expect(ticketing.connect(buyer1).claimRefund(tokenId))
            .to.emit(ticketing, "RefundCredited")
            .withArgs(tokenId, buyer1.address, ethers.parseEther("1"));
    });

    it("reverts claimRefund when caller is not the ticket owner", async function () {
        const { ticketing, buyer2, tokenId } = await loadFixture(deployWithCancelledEventFixture);
        await expect(ticketing.connect(buyer2).claimRefund(tokenId))
            .to.be.revertedWith("Not the ticket owner");
    });

    it("reverts claimRefund when event is not cancelled", async function () {
        const { ticketing, buyer1, tokenId } = await loadFixture(deployWithTicketFixture);
        await expect(ticketing.connect(buyer1).claimRefund(tokenId))
            .to.be.revertedWith("Event is not cancelled");
    });

    it("reverts claimRefund when ticket is already Cancelled", async function () {
        const { ticketing, buyer1, tokenId } = await loadFixture(deployWithCancelledEventFixture);
        await ticketing.connect(buyer1).claimRefund(tokenId);
        await expect(ticketing.connect(buyer1).claimRefund(tokenId))
            .to.be.revertedWith("Ticket must be Valid");
    });

    it("withdrawRefund pays out the full credited balance", async function () {
        const { ticketing, buyer1, tokenId } = await loadFixture(deployWithCancelledEventFixture);
        await ticketing.connect(buyer1).claimRefund(tokenId);
        await expect(ticketing.connect(buyer1).withdrawRefund())
            .to.changeEtherBalance(buyer1, ethers.parseEther("1"));
    });

    it("clears pendingRefunds after withdrawRefund", async function () {
        const { ticketing, buyer1, tokenId } = await loadFixture(deployWithCancelledEventFixture);
        await ticketing.connect(buyer1).claimRefund(tokenId);
        await ticketing.connect(buyer1).withdrawRefund();
        expect(await ticketing.pendingRefunds(buyer1.address)).to.equal(0n);
    });

    it("emits RefundClaimed", async function () {
        const { ticketing, buyer1, tokenId } = await loadFixture(deployWithCancelledEventFixture);
        await ticketing.connect(buyer1).claimRefund(tokenId);
        await expect(ticketing.connect(buyer1).withdrawRefund())
            .to.emit(ticketing, "RefundClaimed")
            .withArgs(buyer1.address, ethers.parseEther("1"));
    });

    it("reverts withdrawRefund when there is no pending refund", async function () {
        const { ticketing, buyer1 } = await loadFixture(deployWithCancelledEventFixture);
        await expect(ticketing.connect(buyer1).withdrawRefund())
            .to.be.revertedWith("No refund available");
    });
});
