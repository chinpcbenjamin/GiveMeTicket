const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TicketingPlatform.withdraw", function () {
  it("transfers the entire balance to the owner", async function () {
    const [owner, buyer] = await ethers.getSigners();

    const TicketingPlatform = await ethers.getContractFactory("TicketingPlatform");
    const ticketing = await TicketingPlatform.deploy();
    await ticketing.waitForDeployment();

    const now = (await ethers.provider.getBlock("latest")).timestamp;
    await ticketing.createEvent(
      "Test Event",
      now + 3600,
      100,
      ethers.parseEther("1"),
      20000,
      1000
    );

    await ticketing.connect(buyer).buyTicket(0, { value: ethers.parseEther("1") });

    const contractAddress = await ticketing.getAddress();
    const contractBalanceBefore = await ethers.provider.getBalance(contractAddress);
    expect(contractBalanceBefore).to.equal(ethers.parseEther("1"));

    await expect(() => ticketing.withdraw()).to.changeEtherBalances(
      [ticketing, owner],
      [-contractBalanceBefore, contractBalanceBefore]
    );
    expect(await ethers.provider.getBalance(contractAddress)).to.equal(0n);
  });
});
